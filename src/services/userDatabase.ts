import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  email: string;
  name: string;
  password: string;
  role: 'HR' | 'Candidate';
  createdAt: string;
}

export class UserDatabase extends Dexie {
  users!: Table<User>;

  constructor() {
    super('TalentFlowUsers');
    this.version(1).stores({
      users: '++id, email, name, role, createdAt'
    });
  }
}

export const userDb = new UserDatabase();

// Initialize with default users
export const initializeUserDatabase = async () => {
  try {
    const userCount = await userDb.users.count();
    
    if (userCount === 0) {
      // Add default HR user
      await userDb.users.add({
        email: 'hr@talentflow.com',
        name: 'HR Manager',
        password: 'password123',
        role: 'HR',
        createdAt: new Date().toISOString()
      });
      
      // Add default candidate user
      await userDb.users.add({
        email: 'candidate@talentflow.com',
        name: 'John Candidate',
        password: 'password123',
        role: 'Candidate',
        createdAt: new Date().toISOString()
      });
      
      console.log('Default users created:');
      console.log('HR: hr@talentflow.com / password123');
      console.log('Candidate: candidate@talentflow.com / password123');
    }
  } catch (error) {
    console.error('Error initializing user database:', error);
  }
};

export const registerUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
  try {
    // Check if user already exists
    const existingUser = await userDb.users.where('email').equals(userData.email).first();
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Add new user
    const userId = await userDb.users.add({
      ...userData,
      createdAt: new Date().toISOString()
    });

    return { success: true, userId };
  } catch (error) {
    throw error;
  }
};

export const getDemoCredentials = () => {
  return {
    hr: {
      email: 'hr@talentflow.com',
      password: 'password123',
      name: 'HR Manager'
    },
    candidate: {
      email: 'candidate@talentflow.com',
      password: 'password123',
      name: 'John Candidate'
    }
  };
};

export const loginUser = async (email: string, password: string) => {
  try {
    const user = await userDb.users.where('email').equals(email).first();
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.password !== password) {
      throw new Error('Invalid password');
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  } catch (error) {
    throw error;
  }
};