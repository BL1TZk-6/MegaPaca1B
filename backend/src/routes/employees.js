import express from "express";
import employeeController from "../controllers/employeesController.js";

//Utilizo Router()
const router = express.Router();

router
  .route("/")
  .get(employeeController.getEmployees)
  .post(employeeController.insertEmployee);

router
  .route("/:id")
  .put(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

export default router;

