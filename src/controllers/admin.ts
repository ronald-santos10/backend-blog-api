import { response, Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import {
  createPost,
  createPostSlug,
  deletePost,
  getAllPosts,
  getPostBySlug,
  handleCover,
  publishPost,
  revertPostToDraft,
  updatePost,
} from "../services/post";
import { getUserById } from "../services/user";
import { coverToUrl } from "../utils/cover-to-url";

export const getPosts = async (req: ExtendedRequest, res: Response) => {
  let page = 1;
  if (req.query.page) {
    page = parseInt(req.query.page as string);
    if (page <= 0) {
      res.json({ error: "Página inexistente" });
      return;
    }
  }

  let posts = await getAllPosts(page);

  const postsToReturn = posts.map((post) => ({
    id: post.id,
    status: post.status,
    title: post.title,
    createdAt: post.createdAt,
    cover: coverToUrl(post.cover),
    authorName: post.author?.name,
    tags: post.tags,
    slug: post.slug,
  }));

  res.json({ posts: postsToReturn, page });
};

export const getPost = async (req: ExtendedRequest, res: Response) => {
  const { slug } = req.params;

  const post = await getPostBySlug(slug);
  if (!post) {
    res.json({ error: "Post inexistente" });
    return;
  }

  res.json({
    post: {
      id: post.id,
      title: post.title,
      createdAt: post.createdAt,
      cover: coverToUrl(post.cover),
      authorName: post.author?.name,
      tags: post.tags,
      body: post.body,
      slug: post.slug,
    },
  });
};

export const addPost = async (req: ExtendedRequest, res: Response) => {
  if (!req.user) return;

  const schema = z.object({
    title: z.string(),
    tags: z.string(),
    body: z.string(),
  });
  const data = schema.safeParse(req.body);
  if (!data.success) {
    res.json({ error: data.error.flatten().fieldErrors });
    return;
  } // O multer-s3 já cuidou do upload. Verifique se o arquivo existe.

  if (!req.file) {
    res.json({ error: "Post sem arquivo ou tipo de arquivo inválido" });
    return;
  } // O req.file.location já contém a URL do S3

  const coverUrl = (req.file as any).location;

  const slug = await createPostSlug(data.data.title);

  const newPost = await createPost({
    authorId: req.user.id,
    slug,
    title: data.data.title,
    tags: data.data.tags,
    body: data.data.body,
    cover: coverUrl, // <--- Use a nova URL do S3
    status: "PUBLISHED",
  });

  const author = await getUserById(newPost.authorId);

  res.status(201).json({
    post: {
      id: newPost.id,
      slug: newPost.slug,
      title: newPost.title,
      createdAt: newPost.createdAt,
      cover: newPost.cover, // <--- coverToUrl não é mais necessária aqui
      tags: newPost.tags,
      authorName: author?.name,
      status: newPost.status,
    },
  });
};

export const editPost = async (req: ExtendedRequest, res: Response) => {
  const { slug } = req.params;

  const schema = z.object({
    status: z.enum(["PUBLISHED", "DRAFT"]).optional(),
    title: z.string().optional(),
    tags: z.string().optional(),
    body: z.string().optional(),
  });
  const data = schema.safeParse(req.body);
  if (!data.success) {
    res.json({ error: data.error.flatten().fieldErrors });
    return;
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    res.json({ error: "O post selecionado não existe" });
    return;
  }

  let coverUrl: string | undefined = undefined;
  if (req.file) {
    coverUrl = (req.file as any).location; // <--- Use a URL do S3
  }

  const updatedPost = await updatePost(slug, {
    updatedAt: new Date(),
    status: data.data.status ?? undefined,
    title: data.data.title ?? undefined,
    tags: data.data.tags ?? undefined,
    body: data.data.body ?? undefined,
    cover: coverUrl,
  });

  const author = await getUserById(updatedPost.authorId);

  res.json({
    post: {
      id: updatedPost.id,
      status: updatedPost.status,
      title: updatedPost.title,
      tags: updatedPost.tags,
      body: updatedPost.body,
      createdAt: updatedPost.createdAt,
      cover: coverToUrl(updatedPost.cover),
      authorName: author?.name,
    },
  });
};

export const removePost = async (req: ExtendedRequest, res: Response) => {
  const { slug } = req.params;

  const post = await getPostBySlug(slug);
  if (!post) {
    res.json({ error: "O post selecionado não existe" });
    return;
  }

  await deletePost(post.slug);
  res.json({ sucesso: "O post foi excluído com sucesso" });
};

export const revertPost = async (req: ExtendedRequest, res: Response) => {
  const { slug } = req.params;

  const post = await getPostBySlug(slug);
  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  const updatedPost = await revertPostToDraft(slug);

  return res.json({
    success: "Post revertido para rascunho com sucesso",
    post: {
      id: updatedPost.id,
      status: updatedPost.status,
      title: updatedPost.title,
      slug: updatedPost.slug,
      updatedAt: updatedPost.updatedAt,
    },
  });
};

export const publishPostAgain = async (req: ExtendedRequest, res: Response) => {
  const { slug } = req.params;

  const post = await getPostBySlug(slug);
  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  const updatedPost = await publishPost(slug);

  return res.json({
    success: "Post publicado com sucesso",
    post: {
      id: updatedPost.id,
      status: updatedPost.status,
      title: updatedPost.title,
      slug: updatedPost.slug,
      updatedAt: updatedPost.updatedAt,
    },
  });
};
