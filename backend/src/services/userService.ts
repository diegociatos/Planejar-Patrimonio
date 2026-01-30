// ===========================================
// Planejar Patrimônio - User Service
// ===========================================

import { query, queryOne } from '../config/database.js';
import { User, UserRole, ClientType, PartnerQualificationData, UserDocument } from '../types/index.js';
import { generateId, hashPassword, comparePassword, transformRow, transformRows } from '../utils/helpers.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors.js';

export class UserService {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const row = await queryOne(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return row ? transformRow<User>(row) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const row = await queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return row ? transformRow<User>(row) : null;
  }

  /**
   * Get all users
   */
  async findAll(role?: UserRole): Promise<User[]> {
    let sql = 'SELECT * FROM users';
    const params: any[] = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }

    sql += ' ORDER BY name ASC';
    const rows = await query(sql, params);
    return transformRows<User>(rows);
  }

  /**
   * Create a new user
   */
  async create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    clientType?: ClientType;
    requiresPasswordChange?: boolean;
  }): Promise<User> {
    // Check if email already exists
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('E-mail já cadastrado');
    }

    const id = generateId();
    const hashedPassword = await hashPassword(data.password);

    await query(
      `INSERT INTO users (id, name, email, password, role, client_type, requires_password_change)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.email.toLowerCase(),
        hashedPassword,
        data.role,
        data.clientType || null,
        data.requiresPasswordChange ?? true,
      ]
    );

    return (await this.findById(id))!;
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.email !== undefined) {
      // Check if new email is taken by another user
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('E-mail já cadastrado');
      }
      updates.push('email = ?');
      params.push(data.email.toLowerCase());
    }

    if (data.role !== undefined) {
      updates.push('role = ?');
      params.push(data.role);
    }

    if (data.clientType !== undefined) {
      updates.push('client_type = ?');
      params.push(data.clientType);
    }

    if (data.avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      params.push(data.avatarUrl);
    }

    if (data.requiresPasswordChange !== undefined) {
      updates.push('requires_password_change = ?');
      params.push(data.requiresPasswordChange);
    }

    if (updates.length > 0) {
      params.push(id);
      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return (await this.findById(id))!;
  }

  /**
   * Update password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await query(
      'UPDATE users SET password = ?, requires_password_change = FALSE WHERE id = ?',
      [hashedPassword, id]
    );
  }

  /**
   * Verify credentials and return user
   */
  async verifyCredentials(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    return user;
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
  }

  /**
   * Reset password (admin function)
   */
  async resetPassword(id: string, temporaryPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(temporaryPassword);
    await query(
      'UPDATE users SET password = ?, requires_password_change = TRUE WHERE id = ?',
      [hashedPassword, id]
    );
  }

  /**
   * Get qualification data for a partner
   */
  async getQualificationData(userId: string): Promise<PartnerQualificationData | null> {
    const row = await queryOne(
      'SELECT * FROM partner_qualification_data WHERE user_id = ?',
      [userId]
    );
    return row ? transformRow<PartnerQualificationData>(row) : null;
  }

  /**
   * Update qualification data
   */
  async updateQualificationData(
    userId: string,
    data: Partial<PartnerQualificationData>
  ): Promise<PartnerQualificationData> {
    const existing = await this.getQualificationData(userId);

    if (existing) {
      // Update existing
      const updates: string[] = [];
      const params: any[] = [];

      const fields = [
        'cpf', 'rg', 'marital_status', 'property_regime', 'birth_date',
        'nationality', 'address', 'phone', 'declares_income_tax'
      ];

      const dataMap: Record<string, any> = {
        cpf: data.cpf,
        rg: data.rg,
        marital_status: data.maritalStatus,
        property_regime: data.propertyRegime,
        birth_date: data.birthDate,
        nationality: data.nationality,
        address: data.address,
        phone: data.phone,
        declares_income_tax: data.declaresIncomeTax,
      };

      for (const field of fields) {
        if (dataMap[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(dataMap[field]);
        }
      }

      if (updates.length > 0) {
        params.push(userId);
        await query(
          `UPDATE partner_qualification_data SET ${updates.join(', ')} WHERE user_id = ?`,
          params
        );
      }
    } else {
      // Insert new
      const id = generateId();
      await query(
        `INSERT INTO partner_qualification_data 
         (id, user_id, cpf, rg, marital_status, property_regime, birth_date, nationality, address, phone, declares_income_tax)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          data.cpf || null,
          data.rg || null,
          data.maritalStatus || null,
          data.propertyRegime || null,
          data.birthDate || null,
          data.nationality || null,
          data.address || null,
          data.phone || null,
          data.declaresIncomeTax ?? false,
        ]
      );
    }

    return (await this.getQualificationData(userId))!;
  }

  /**
   * Get user documents
   */
  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const rows = await query(
      'SELECT * FROM user_documents WHERE user_id = ? ORDER BY uploaded_at DESC',
      [userId]
    );
    return transformRows<UserDocument>(rows);
  }

  /**
   * Add user document
   */
  async addUserDocument(data: {
    userId: string;
    name: string;
    category: string;
    url: string;
  }): Promise<UserDocument> {
    const id = generateId();
    await query(
      `INSERT INTO user_documents (id, user_id, name, category, url)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.userId, data.name, data.category, data.url]
    );

    const row = await queryOne('SELECT * FROM user_documents WHERE id = ?', [id]);
    return transformRow<UserDocument>(row);
  }

  /**
   * Delete user document
   */
  async deleteUserDocument(id: string): Promise<void> {
    await query('DELETE FROM user_documents WHERE id = ?', [id]);
  }
}

export const userService = new UserService();
