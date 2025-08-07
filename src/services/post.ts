import slug from "slug";
import { prisma } from "../libs/prisma";
import { Prisma } from "@prisma/client";

export const getPublishedPosts = async (page: number, limit: number) => {
  if (page <= 0 || limit <= 0) return [];

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: (page - 1) * limit,
  });

  return posts;
};

export const getPostswithSameTags = async (slug: string) => {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return [];

  const tags = post.tags.split(",");
  if (tags.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      slug: { not: slug },
      OR: tags.map((term) => ({
        tags: {
          contains: term.trim(),
        },
      })),
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });
  return posts;
};

export const getAllPosts = async (page: number) => {
  let perPage = 9;
  if (page <= 0) return [];

  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: perPage,
    skip: (page - 1) * perPage,
  });

  return posts;
};

export const getPublishedPostsByTag = async (tag: string, limit?: number) => {
  const terms = tag.split(",").map((t) => t.trim());

  return await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: terms.map((term) => ({
        tags: {
          contains: term,
        },
      })),
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
};

export const getPostBySlug = async (slug: string) => {
  return await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });
};

export const createPostSlug = async (title: string) => {
  let newSlug = slug(title);
  let keepTrying = true;
  let postCount = 1;

  while (keepTrying) {
    const post = await getPostBySlug(newSlug);
    if (!post) {
      keepTrying = false;
    } else {
      newSlug = slug(`${title} ${++postCount}`);
    }
  }

  return newSlug;
};

type createPostProps = {
  authorId: number;
  slug: string;
  title: string;
  tags: string;
  body: string;
  cover: string;
  status: "PUBLISHED" | "DRAFT";
};
export const createPost = async (data: createPostProps) => {
  return await prisma.post.create({ data });
};

export const updatePost = async (
  slug: string,
  data: Prisma.PostUpdateInput
) => {
  return await prisma.post.update({
    where: { slug },
    data,
  });
};

export const deletePost = async (slug: string) => {
  return await prisma.post.delete({ where: { slug } });
};

export const revertPostToDraft = async (slug: string) => {
  return await prisma.post.update({
    where: { slug },
    data: {
      status: "DRAFT",
      updatedAt: new Date(),
    },
  });
};

export const publishPost = async (slug: string) => {
  return await prisma.post.update({
    where: { slug },
    data: {
      status: "PUBLISHED",
      updatedAt: new Date(),
    },
  });
};
