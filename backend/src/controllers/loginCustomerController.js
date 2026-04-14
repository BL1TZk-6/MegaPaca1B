import customerModel from "../models/customers.js"
import bcrypt from "bcryptjs";
import  JsonWebTokenError from "jsonwebtoken";
import { config } from "../../config.js";


//Array de funciones
const loginCustomersController = {}

loginCustomersController.login = async (req, res) => {
    //#1 solicito los datos
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ message: "Correo inválido" });
    }

    try {
        //#1 buscar el correo electronico en la base de datos
        const customerFound = await customerModel.findOne({email});

        if(!customerFound){
            return res.status(400).json({message: "Customer not found"})
        }

        //Verifivcar si l usuario está bloqueado
        if(customerFound.timeOut && customerFound.timeOut > Date.now()){
           return res.status(403).json({message: "Cuenta bloqueada"})
        }

        //validar la contraseña
        const isMatch = await bcrypt.compare(password, customerFound.password)

        if(!isMatch){
            customerFound.loginAttemps = (customerFound.loginAttemps || 0) + 1;
            
            //Si llega a 5 intentos fallidos se bloquea la cuenta
            if (customerFound.loginAttemps >= 5){
                customerFound.timeOut = Date.now() + 5 * 60 * 1000;
                customerFound.loginAttemps = 0;

                await customerFound.save();

                return res.status(403).json({message: "Cuenta bloqueada por multiples intentos fallidos"})
            }
        }

        //Resetear intentos si login correcto
        customerFound.loginAttemps = 0;
        customerFound.timeOut = null;

        //Generar el token 
        const token = JsonWebTokenError.sign(
            //#1- Que datos vamos a guardar
            {id: customerFound._id, userType: "Customer" },
            //#2- secret key
            config.JWT.secret,
            //#3 cuando expira
            {expiresIn: "30d"}
        );

        //El token lo guardamos en una cookie
        res.cookie("authCookie", token)
        return res.status(200).json({message: "Login exitoso"})

    } catch (error){
        console.log("error" + error);
        return res.status(500).json({message: "Internal server error"})
    }
};

export default loginCustomersController;