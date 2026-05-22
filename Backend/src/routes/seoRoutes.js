import express from "express";
import { getMetaBySlug, getSitemap } from "../controllers/seoController.js";

const router = express.Router();

router.get("/sitemap", getSitemap);
router.get("/meta/:slug", getMetaBySlug);

export default router;
