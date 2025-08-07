import { RequestHandler } from "express";
import {
  getPostBySlug,
  getPostswithSameTags,
  getPublishedPosts,
  getPublishedPostsByTag,
} from "../services/post";

export const getAllPosts: RequestHandler = async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;

  if (page <= 0) {
    return res.status(400).json({ error: "Página inexistente" });
  }

  try {
    const posts = await getPublishedPosts(page, limit);

    const postsToReturn = posts.map((post) => ({
      id: post.id,
      status: post.status,
      title: post.title,
      createdAt: post.createdAt,
      cover: post.cover,
      authorName: post.author?.name,
      tags: post.tags,
      slug: post.slug,
    }));

    res.json({ posts: postsToReturn, page });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
};


export const getPost: RequestHandler = async (req, res) => {
  const { slug } = req.params;

  const post = await getPostBySlug(slug);
  if (!post || (post && post.status !== "PUBLISHED")) {
    res.json({ error: "Post inexistente" });
    return;
  }

  res.json({
    post: {
      id: post.id,
      title: post.title,
      createdAt: post.createdAt,
      cover: post.cover,
      authorName: post.author?.name,
      tags: post.tags,
      body: post.body,
      slug: post.slug,
    },
  });
};

export const getRelatedPosts: RequestHandler = async (req, res) => {
  const { slug } = req.params;

  let posts = await getPostswithSameTags(slug);

  const postsToReturn = posts.map((post) => ({
    id: post.id,
    title: post.title,
    createdAt: post.createdAt,
    cover: post.cover,
    authorName: post.author?.name,
    tags: post.tags,
    slug: post.slug,
  }));
  res.json({ posts: postsToReturn });
};

export const getPostsByTag: RequestHandler = async (req, res) => {
  const { tag } = req.params;
  const limit = parseInt(req.query.limit as string) || undefined;

  if (!tag) {
    return res.status(400).json({ error: "Tag não informada." });
  }

  try {
    const posts = await getPublishedPostsByTag(tag, limit);

    const postsToReturn = posts.map((post) => ({
      id: post.id,
      status: post.status,
      title: post.title,
      createdAt: post.createdAt,
      cover: post.cover,
      authorName: post.author?.name,
      tags: post.tags,
      slug: post.slug,
    }));

    res.json({ posts: postsToReturn });
  } catch (error) {
    res.status(500).json({ error: "Erro interno ao buscar posts por tag." });
  }
};