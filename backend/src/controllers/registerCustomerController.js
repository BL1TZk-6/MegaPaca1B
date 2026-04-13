import nodemailer from "nodemailer"; //enviar correo
import crypto from "crypto"; //generar código aleatorio 
import jsonwebtoken from "jsonwebtoken"; //token
import bcryptjs from "bcryptjs" //encriptar

 import customerModel from "../models/customers.js";

 //array de funciones
 const registerCustomerController = {};

 registerCustomerController.register = async (req, res) => {
    _//#1 solicitar datos
    const {
        name,
        lastName,
        birthday,
        email,
        password,
        isVerified
    } = req.body;

    try {
        
    } catch (error) {

    }
 }