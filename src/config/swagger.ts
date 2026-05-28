import swaggerJsdoc from 'swagger-jsdoc';
import env from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GoberVial API',
    version: '1.0.0',
    description:
      'Plataforma de Auditoria Ciudadana Vial del Magdalena. ' +
      'API REST para reportar danos en infraestructura vial y alcantarillado.',
    contact: {
      name: 'GoberVial Team',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Entorno de desarrollo',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['nombres', 'apellidos', 'numeroDocumento', 'email', 'password'],
        properties: {
          nombres: { type: 'string', example: 'Juan Carlos' },
          apellidos: { type: 'string', example: 'Perez Gomez' },
          numeroDocumento: { type: 'string', example: '1234567890' },
          email: { type: 'string', format: 'email', example: 'juan@gmail.com' },
          telefono: { type: 'string', example: '3001234567' },
          password: { type: 'string', format: 'password', example: 'Segura123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan@gmail.com' },
          password: { type: 'string', format: 'password', example: 'Segura123' },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'string', example: '24h' },
          user: { $ref: '#/components/schemas/UserResponse' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          rolId: { type: 'integer' },
          nombres: { type: 'string' },
          apellidos: { type: 'string' },
          numeroDocumento: { type: 'string' },
          email: { type: 'string' },
          telefono: { type: 'string', nullable: true },
          estadoBiometria: { type: 'string', enum: ['Pendiente', 'Verificada', 'Rechazada'] },
          fechaRegistro: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object', nullable: true },
          error: { type: 'string', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      BiometriaResponse: {
        type: 'object',
        properties: {
          estado: { type: 'string', enum: ['Pendiente', 'Verificada', 'Rechazada'] },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],
});

export default swaggerSpec;
