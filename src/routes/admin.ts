import { Router } from "express";
import * as adminController from "../controllers/admin";
import { privateRoute } from "../middlewares/private-route";
import { upload } from "../libs/multer";

export const adminRoutes = Router();

adminRoutes.post("/posts", privateRoute, upload.single('cover'), adminController.addPost);
adminRoutes.get("/posts", privateRoute, adminController.getPosts);
adminRoutes.get("/posts/:slug", privateRoute, adminController.getPost);
adminRoutes.put("/posts/:slug", privateRoute, upload.single('cover'), adminController.editPost);
adminRoutes.put("/posts/:slug/revert", privateRoute, adminController.revertPost);
adminRoutes.put("/posts/:slug/publish", privateRoute, adminController.publishPostAgain);
adminRoutes.delete("/posts/:slug", adminController.removePost);
