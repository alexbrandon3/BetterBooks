import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Account } from './entities/Account';
import { User } from './entities/User'; 
// import future entities here

console.log('Loaded DB_PASSWORD:', typeof process.env.DB_PASSWORD, process.env.DB_PASSWORD);


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: true,
  entities: [Account, User], // add more as you build
  migrations: [],
  subscribers: [],
});
