//Creo un array de funciones
const branchesController = {};
//importo la colección que voy a utilizar
import branchesModel from "../models/branches.js";

//SELECT
branchesController.getbranches = async (req, res) => {
  const branches = await branchesModel.find();
  res.json(branches);
};

//INSERTAR
branchesController.insertBranches = async (req, res) => {
  //#1- Solicito los datos a guardar
  const { name, address, schedule, isActive } = req.body;

  //#2- Llenar el modelo con estos datos
  const newBranch = new branchesModel({ name, address, schedule, isActive });

  //#3- Guardar todo en la base de datos
  await newBranch.save();

  res.json({ message: "Branch saved" });
};

//DELETE
branchesController.deleteBranches = async (req, res) => {
  await branchesModel.findByIdAndDelete(req.params.id);
  res.json({ message: "Branch deleted" });
};

//UPDATE
branchesController.updateBranches = async (req, res) => {
  //#1- Solicito los nuevos datos
  const { name, address, schedule, isActive } = req.body;

  //#2- Actualizo
  await branchesModel.findByIdAndUpdate(
    req.params.id,
    {
      name,
      address,
      schedule,
      isActive,
    },
    { new: true },
  );

  res.json({ message: "Branch updated" });
};

export default branchesController;
