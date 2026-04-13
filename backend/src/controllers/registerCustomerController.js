import nodemailer from "nodemailer"; //enviar correo
import crypto from "crypto"; //generar código aleatorio 
import jsonwebtoken from "jsonwebtoken"; //token
import bcryptjs from "bcryptjs" //encriptar
import { config } from "../../config.js";
import customerModel from "../models/customers.js";

 //array de funciones
 const registerCustomerController = {};

 registerCustomerController.register = async (req, res) => {
    //#1 solicitar datos
    const {
        name,
        lastName,
        birthdate,
        email,
        password,
        isVerified
    } = req.body;

    try {

        // validar que el correo no exista
        const exitsCustomer = await customerModel.findOne({ email });
        if (exitsCustomer) {
            return res.status(400).json({ message: "Customer Already Exists" });
        }

        // Encriptar contraseña
        const passwordHashed = await bcryptjs.hash(password, 10);
        
        //Generar un código aleatorio
        const randomNumber = crypto.randomBytes(3).toString("hex")

        //Guardamos en un token la información
        const token = jsonwebtoken.sign(
            //#1 que vamos a guardar
            {randomNumber,  
            name,
            lastName,
            birthdate,
            email,
            password: passwordHashed,
            isVerified
            },
            //#2 Secret Key
            config.JWT.secret,
            //#3 cuando expira
            {expiresIn: "15m"}
        );

        res.cookie("Conchagua", token, {maxAge: 15 * 60 * 1000})

        //ENVIAMOS EL CÓDIGO ALEATORIO POR CORREO ELECTRONICO
        //#1-- Transporter -> ¿Quién envía el correo?
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user: config.email.user_email,
                pass: config.email.user_password
            }
        })

        //#2- mailOption -> ¿Quién lo recibe y como?
        const mailOptions = {
            from: config.email.user_email,
            to: email,
            subject: "Verificación de cuenta",
            text: "Para verificar tu cuenta, utiliza este código: "
            + randomNumber + " expira en 15 minutos"
        }

        //#3- enviar el correo
        transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                console.log("error " +  error)
                return res.status(500).json({message: "Error sending email"})
            }
            return res.status(200).json({message: "Email sent"})
        })

    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Internal server error"})
    }
    
 };

 //Verificar el código que escribieron en el frontend
 registerCustomerController.verifyCode = async (req, res) => {
    try {
        //solicitamos el código que escribieron en el frontend
        const {verificationCodeRequest } = req.body

        //Obtener el token de las cookies
        const token = req.cookies.Conchagua

        //Extraer toda la información de token
        const decoded = jsonwebtoken.verify(token, config.JWT.secret);
        const {
            randomNumber: storedCode,
            name,
            lastName,
            birthdate,
            email,
            password,
            isVerified,
        } = decoded;

        //Comparar lo que el usuario escribió con el código que está en el token
        if(verificationCodeRequest !== storedCode){
            return res.status(400).json({message: "Invalid code"})
        }

        //Si todo está bien, y el usuario el código, Lo registramos en la DB
        const NewCustomer = new customerModel({
            name,
            lastName,
            birthdate,
            email,
            password,
            isVerified
        });

        await NewCustomer.save();
        
        res.clearCookie("Conchagua")

        return res.status(200).json({message: "Customer resgistered"})

    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Internal server error"})
    }
 };

export default registerCustomerController;