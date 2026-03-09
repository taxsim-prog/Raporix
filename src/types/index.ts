// filepath: c:\Users\Rithk\Desktop\FormApp\formApp\src\types\index.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  // Add other relevant fields as needed
}

export interface TabName {
  Dashboard: string;
  Forms: string;
  Business: string;
  Profile: string;
}