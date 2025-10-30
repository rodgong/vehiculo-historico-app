package com.vehiculohistorico.control.data.dao

import androidx.room.*
import com.vehiculohistorico.control.data.entities.VehiculoCompartido
import kotlinx.coroutines.flow.Flow

@Dao
interface VehiculoCompartidoDao {
    @Query("SELECT * FROM vehiculos_compartidos WHERE usuarioId = :usuarioId")
    fun getVehiculosCompartidosByUsuario(usuarioId: Long): Flow<List<VehiculoCompartido>>
    
    @Insert
    suspend fun insertVehiculoCompartido(vehiculoCompartido: VehiculoCompartido)
    
    @Query("SELECT * FROM vehiculos_compartidos WHERE codigoCompartido = :codigo AND usuarioId = :usuarioId")
    suspend fun getVehiculoCompartido(codigo: String, usuarioId: Long): VehiculoCompartido?
}