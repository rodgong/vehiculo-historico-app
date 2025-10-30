package com.vehiculohistorico.control.data.dao

import androidx.room.*
import com.vehiculohistorico.control.data.entities.Usuario
import kotlinx.coroutines.flow.Flow

@Dao
interface UsuarioDao {
    @Query("SELECT * FROM usuarios WHERE email = :email AND password = :password")
    suspend fun login(email: String, password: String): Usuario?
    
    @Query("SELECT * FROM usuarios WHERE email = :email")
    suspend fun getUsuarioByEmail(email: String): Usuario?
    
    @Insert
    suspend fun insertUsuario(usuario: Usuario): Long
    
    @Query("SELECT * FROM usuarios WHERE id = :id")
    suspend fun getUsuarioById(id: Long): Usuario?
}