package com.vehiculohistorico.control.data.repository

import com.vehiculohistorico.control.data.dao.UsuarioDao
import com.vehiculohistorico.control.data.entities.Usuario
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsuarioRepository @Inject constructor(
    private val usuarioDao: UsuarioDao
) {
    suspend fun login(email: String, password: String): Usuario? =
        usuarioDao.login(email, password)

    suspend fun registrarUsuario(nombre: String, email: String, password: String): Long? {
        val usuarioExistente = usuarioDao.getUsuarioByEmail(email)
        
        return if (usuarioExistente == null) {
            val usuario = Usuario(
                nombre = nombre,
                email = email,
                password = password
            )
            usuarioDao.insertUsuario(usuario)
        } else {
            null
        }
    }

    suspend fun getUsuarioById(id: Long): Usuario? =
        usuarioDao.getUsuarioById(id)
}