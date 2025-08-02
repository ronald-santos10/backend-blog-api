import { User } from "@prisma/client";
import { createJwt, readJwt } from "../libs/jwt";
import { Request } from "express";
import { TokenPayload } from "../types/token-payload";
import { getUserById } from "./user";

export const createToken = (user: User) => {
  return createJwt({ id: user.id });
};

export const verifyRequest = async (req: Request) => {
  const { authorization } = req.headers;

  if (authorization) {
    const authSplit = authorization.split("Bearer ");
    if (authSplit[1]) {
      const payload = readJwt(authSplit[1]);
      if (payload) {
        const userId = (payload as TokenPayload).id;
        const user = await getUserById(userId);
        if (user) return user;
      }
    }
  }
  return false;
};
