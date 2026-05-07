import jsonwebtoken from "jsonwebtoken"; //Generar tokens
import bcrypt from "bcryptjs"; //Encriptar contraseñas
import crypto from "crypto"; //Generar tokens aleatorios
import nodemailer from "nodemailer"; //Enviar correos electrónicos
import { config } from "../../config.js";
import customers from "../models/customers.js";
import HTMLRecoveryEmail from "../utils/sendMailRecovery.js";

//Array de funciones

const recoveryPasswordController = {}

recoveryPasswordController.requestCode = async (req, res) => {
    try {
        //#1 solicitamos los datos
        const { email } = req.body;

        //Validar que el correo si exista en la bd
        const userFound = await customers.findOne({ email });

        if(!userFound){
            return res.status(404).json({message: "user not found"})
        }

        //Generar el código aleatorio
        const randomCode = crypto.randomBytes(3).toString("hex")

        //guardamos todo en un token
        const token = jsonwebtoken.sign(
            {email, randomCode, userType: "customer", verified: false},
            //#2 clave secreta
            config.JWT.secret,
            //#3- ¿Cúando expira?
            {expiresIn: "15m"},
        );

        res.cookie("recoveryCookie", token, {maxAge: 15 * 60 *1000})

        //Enviar por correo electronico el código que generamos
         //#1- ¿Quién lo envía?
         const transporter = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user: config.email.user_email,
                pass: config.email.user_password
            }
         })

         //#2 mailOptions -> ¿Quien lo enví y cómo?
         const mailOptions = {
            from: config.email.user_email,
            to: email,
            subject: "Código de recuperación",
            body: "El código expira en 15 minutos",
            html: HTMLRecoveryEmail(randomCode)
         }

         //#3- Enviar el correo electronico
         transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                return res.status(500).json({message: "Error sending email"})
            }
         }) 

         return res.status(200).json({message: "Email sent"})

    } catch (error) {
        console.log("error" + error)
        return res.status(200).json({message: "Intrnal server error"})
    }
};

recoveryPasswordController.verifyCode = async (req, res ) => {
    try {
        //#1 solicitamos los datos
        const { code } = req.body;
        //Obtenemos la información que está dentro del token
        //Accedemos a la cookie
        const token = req.cookies.recoveryCookie;
        const decoded = jsonwebtoken.verify(token, config.JWT.secret)

        //Ahora comparo el código que el usuario escribió
        //con el que está dentro del token
        if(code !== decoded.randomCode){
            return res.status(400).json({message: "Invalid code"})
        }

        //En cambio, si escribe bien el código
        //vamos a colocar en el token que ya está verificado
        const newToken = jsonwebtoken.sign(
            //#1 ¿Qué vamos a guardar
            { email: decoded.email, userType: "customer", verified: true },
            config.JWT.secret,
            { expiresIn: "15m" },
        );
        res.cookie("recoveryCookie", newToken, {maxAge: 15 * 60 * 1000});
        return res.status(200).json({message: "Code verified successfully"});

    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Internal server error"})
    }
};

recoveryPasswordController.newPassword = async (req, res) => {

    try {
        const { newPassword, confirmNewPassword } = req.body;

        //Camparo las dos contraseñas
        if(newPassword !== confirmNewPassword){
            return res.stauts(400).json({message: "password doesn't match"})
        }
        //Vamos comprobar que la constante verified que está en el token
        //ya esté en true (o sea que haya pasado por el paso 2)
        const token = req.cookies.recoveryCookie;
        const decoded = jsonwebtoken.verify(token, config.JWT.secret);

        if(!decoded.verified){
            return res.status(400).json({message: "code not verified"})
        }

        /////////
        //Encriptar
        const passwordHash = await bcrypt.hash(newPassword, 10)
        
        //Actualizamos la contraseña en la base de datos
        await customers.findOneAndUpdate(
            {email: decoded.email},
            {password: passwordHash},
            {new: true},
        );

        res.clearCookie("recoveryCookie");

        return res.status(200).json({message: "Password update"})
    } catch (error) {
        console.log("error" + error)
        return res.status(500).json({message: "Internal Server Error"})
    }
}; 

export default recoveryPasswordController;