import pkg from '@prisma/client';
import { generateToken, hashPassword, comparePassword } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const register = async (req, res, next) => {
  try {
    const { email, username, password, nombre, apellidos } = req.body;

    // Validaciones
    if (!email || !username || !password || !nombre || !apellidos) {
      throw new AppError('Todos los campos son requeridos', 400);
    }

    // Verificar si el usuario ya existe
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (userExists) {
      throw new AppError('El email o username ya está registrado', 400);
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        nombre,
        apellidos,
        role: 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellidos: true,
        role: true,
      },
    });

    // Generar token
    const token = generateToken(user.id, user.role);

    logger.info(`✅ Usuario registrado: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos', 400);
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Generar token
    const token = generateToken(user.id, user.role);

    logger.info(`✅ Login exitoso: ${email}`);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          nombre: user.nombre,
          apellidos: user.apellidos,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        nombre: true,
        apellidos: true,
        role: true,
      },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  // En implementación con JWT, el logout se maneja en el frontend eliminando el token
  res.json({
    success: true,
    message: 'Logout exitoso',
  });
};
