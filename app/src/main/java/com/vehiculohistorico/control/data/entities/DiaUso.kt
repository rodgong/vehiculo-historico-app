package com.vehiculohistorico.control.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "dias_uso")
data class DiaUso(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val vehiculoId: Long,
    val usuarioId: Long,
    val fecha: Date,
    val nombreUsuario: String
)