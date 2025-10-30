package com.vehiculohistorico.control.data.dao

import androidx.room.*
import com.vehiculohistorico.control.data.entities.DiaUso
import kotlinx.coroutines.flow.Flow
import java.util.Date

@Dao
interface DiaUsoDao {
    @Query("SELECT * FROM dias_uso WHERE vehiculoId = :vehiculoId ORDER BY fecha DESC")
    fun getDiasUsoByVehiculo(vehiculoId: Long): Flow<List<DiaUso>>
    
    @Query("SELECT COUNT(*) FROM dias_uso WHERE vehiculoId = :vehiculoId")
    suspend fun getContadorDias(vehiculoId: Long): Int
    
    @Query("SELECT * FROM dias_uso WHERE vehiculoId = :vehiculoId AND fecha = :fecha")
    suspend fun getDiaUsoByFecha(vehiculoId: Long, fecha: Date): DiaUso?
    
    @Insert
    suspend fun insertDiaUso(diaUso: DiaUso)
    
    @Delete
    suspend fun deleteDiaUso(diaUso: DiaUso)
    
    @Update
    suspend fun updateDiaUso(diaUso: DiaUso)
}