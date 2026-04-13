import express from "express";
import branchesController from "../controllers/branchesController.js";

//Utilizo Router() para definir los metodos (ger, post, put)
//para mi endpoint

const router = express.Router();

router
  .route("/")
  .get(branchesController.getbranches)
  .post(branchesController.insertBranches);

router
  .route("/:id")
  .put(branchesController.updateBranches)
  .delete(branchesController.deleteBranches);

export default router;
