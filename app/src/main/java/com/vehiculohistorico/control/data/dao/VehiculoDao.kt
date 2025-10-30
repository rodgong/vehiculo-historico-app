package com.vehiculohistorico.control.data.dao

import androidx.room.*
import com.vehiculohistorico.control.data.entities.Vehiculo
import kotlinx.coroutines.flow.Flow

@Dao
interface VehiculoDao {
    @Query("SELECT * FROM vehiculos WHERE usuarioId = :usuarioId")
    fun getVehiculosByUsuario(usuarioId: Long): Flow<List<Vehiculo>>
    
    @Query("SELECT * FROM vehiculos WHERE codigoCompartido = :codigo")
    suspend fun getVehiculoByCodigo(codigo: String): Vehiculo?
    
    @Insert
    suspend fun insertVehiculo(vehiculo: Vehiculo): Long
    
    @Update
    suspend fun updateVehiculo(vehiculo: Vehiculo)
    
    @Delete
    suspend fun deleteVehiculo(vehiculo: Vehiculo)
    
    @Query("SELECT * FROM vehiculos WHERE id = :id")
    suspend fun getVehiculoById(id: Long): Vehiculo?
}