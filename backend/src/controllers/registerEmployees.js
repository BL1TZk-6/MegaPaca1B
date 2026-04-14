import nodemailer from "nodemailer"; //enviar correo
import crypto from "crypto"; //generar código aleatorio 
import jsonwebtoken from "jsonwebtoken"; //token
import bcryptjs from "bcryptjs" //encriptar
import { config } from "../../config.js";
import employeeModel from "../models/employees.js";
import { error } from "console";

const registerEmployeesController = {};

registerEmployeesController.register = async (req, res) => {
    const {
    name,
    lastName,
    salary,
    DUI,
    phone,
    email,
    password,
    idBranches,
    } = req.body;

    try {
        const exitsEmployee = await employeeModel.findOne ({ email });
        if (exitsEmployee) {
            return res.status(400).json({message: "Employee already exitst"});
        }

        const passwordHashed = await bcryptjs.hash(password, 10);

        const randomNumber = crypto.randomBytes(3).toString("hex")

        const token = jsonwebtoken.sign(
            {
                randomNumber,
                name,
                lastName,
                salary,
                DUI,
                phone,
                email,
                password,
                idBranches 
            }, 
            config.JWT.secret,
            {expiresIn: "15m"}
        );
        res.cookie("Pombis", token, {maxAge: 15 * 60 * 1000})

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user: config.email.user_email,
                pass: config.email.user_password
            }
        })

        const mailOptions = {
            from: config.email.user_email,
            to: email,
            subject: "Verificación de cuenta",
            text: "Para verificar tu cuenta, utiliza este código: "
            + randomNumber + " expira en 15 minutos"
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.log("error " + error)
                return res.status(500).json({message: "Error sending email"})
            }
            return res.status(200).json({message: "Email sent"})
        })

    } catch (error) {
        console.log("error " + error)
        return res.status(500).json({message: "Internal server error"})
    }
};

registerEmployeesController.verifyCode = async (req, res) => {
    try {
        const {verificationCodeRequest} = req.body
        const token = req.cookies.Pombis

        const decoded = jsonwebtoken.verify(token, config.JWT.secret);
        const {
            randomNumber: storedCode,
            name,
            lastName,
            salary,
            DUI,
            phone,
            email,
            password,
            idBranches
        } = decoded

        if(verificationCodeRequest !== storedCode){
            return res.status(400).json({message: "Invalid Code"})
        }

        const NewEmployee = new employeeModel({
            name,
            lastName,
            salary,
            DUI,
            phone,
            email,
            password,
            idBranches
        })

        await NewEmployee.save();

        res.clearCookie("Pombis")

        return res.status(200).json({message: "Employee Registered"})
    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Internal Server Error"})
    }
};

export default registerEmployeesController;