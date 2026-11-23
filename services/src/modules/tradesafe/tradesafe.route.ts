import { Router } from "express";
import { tradesafeCallback } from "./tradesafe.controller.js";

export const tradesafeRouter = Router();

tradesafeRouter.post("/callback", tradesafeCallback);
