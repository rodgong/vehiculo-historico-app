package com.vehiculohistorico.control.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "vehiculos_compartidos")
data class VehiculoCompartido(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val vehiculoId: Long,
    val usuarioId: Long,
    val codigoCompartido: String
)