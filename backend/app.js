import express from "express";
import productRoutes from "./src/routes/products.js";
import branchesRoutes from "./src/routes/branches.js";
import employeesRoutes from "./src/routes/employees.js";
import customerRoutes from "./src/routes/customer.js"
import resgisterCustomerRoutes from "./src/routes/registerCustomer.js"
import loginCustomersRoutes from "./src/routes/login.js"
import cookieParser from "cookie-parser";
import logoutRoutes from "./src/routes/logout.js"
import cors from "cors";
import recoveryPasswordRoutes from "./src/routes/recoveryPassword.js";

//Creo una constante que guarde Express
const app = express();

app.use(cors({
    origin: [ "http://localhost:5173", "http://localhost:5174" ],
    //Permitir el envio de cookies y credenciales
    credentials: true, 
 }),
);

app.use(cookieParser())

//Que acepte los json desde postman
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/registerCustomer", resgisterCustomerRoutes);
app.use ("/api/loginCustomers", loginCustomersRoutes);
app.use("/api/logout", logoutRoutes);
app.use("/api/recoveryPassword", recoveryPasswordRoutes);

export default app;
