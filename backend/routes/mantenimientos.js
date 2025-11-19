//Ya no moverle a nada en lo del chekcklist ya aquí ya es hermoso y perfecto
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { uploadImageToS3 } = require('../aws-s3');

// Función para determinar el tipo de mantenimiento según el mes
function getTipoMantenimiento(mes) {
  const mesNum = parseInt(mes);
  
  if (mesNum === 12) return "Avanzado";
  if (mesNum === 3 || mesNum === 6 || mesNum === 9) return "Intermedio";
  return "Básico";
}

// BLOQUE 1: Obtener mantenimientos por año - MODIFICADO
router.get("/", async (req, res) => {
  try {
    console.log("GET /api/mantenimientos - Query params:", req.query);
    
    const { anio, montacargasId } = req.query;

    if (!anio || !montacargasId) {
      return res.status(400).json({ success: false, error: "anio y montacargasId son requeridos" });
    }

    const anioNum = parseInt(anio);
    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(anioNum) || isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "anio y montacargasId deben ser números válidos" 
      });
    }

    // MODIFICACIÓN: Incluir campos de status, tecnico_nombre, observaciones, completado_en
    const result = await pool.query(
      `SELECT id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, tecnico_nombre, 
              status, creado_en, completado_en, observaciones
       FROM mantenimientos_programados 
       WHERE montacargas_id = $1 AND anio = $2 
       ORDER BY mes`,
      [montacargasIdNum, anioNum]
    );

    res.json({ success: true, mantenimientos: result.rows });
  } catch (err) {
    console.error("Error obteniendo mantenimientos:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});
// FIN BLOQUE 1: Obtener mantenimientos por año

// BLOQUE 2: Obtener todos los mantenimientos de un montacargas - MODIFICADO
router.get("/todos", async (req, res) => {
  try {
    console.log("GET /api/mantenimientos/todos - Query params:", req.query);
    
    const { montacargasId } = req.query;

    if (!montacargasId) {
      return res.status(400).json({ success: false, error: "montacargasId es requerido" });
    }

    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "montacargasId debe ser un número válido" 
      });
    }

    // MODIFICACIÓN: Incluir campos de status y observaciones
    const result = await pool.query(
      `SELECT id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, tecnico_nombre,
              status, creado_en, completado_en, observaciones
       FROM mantenimientos_programados 
       WHERE montacargas_id = $1 
       ORDER BY anio DESC, mes ASC`,
      [montacargasIdNum]
    );

    console.log(`Encontrados ${result.rows.length} mantenimientos para montacargas ${montacargasIdNum}`);
    res.json({ success: true, mantenimientos: result.rows });
  } catch (err) {
    console.error("Error obteniendo todos los mantenimientos:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});
// FIN DEL BLOQUE 2: Obtener todos los mantenimientos de un montacargas

// BLOQUE 3: Crear mantenimientos anuales automáticos - SIN CAMBIOS
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/mantenimientos - Body:", req.body);
    
    const { anio, dia, montacargasId } = req.body;

    if (!anio || !dia || !montacargasId) { 
      return res.status(400).json({ success: false, error: "anio, dia y montacargasId son requeridos" });
    }

    const anioNum = parseInt(anio);
    const diaNum = parseInt(dia);
    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(anioNum) || isNaN(diaNum) || isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "Los valores deben ser números válidos" 
      });
    }

    if (diaNum < 1 || diaNum > 28) {
      return res.status(400).json({ 
        success: false, 
        error: "El día debe estar entre 1 y 28" 
      });
    }

    // Verificar si el montacargas existe
    const montacargasExiste = await pool.query(
      "SELECT numero FROM \"Montacargas\" WHERE numero = $1",
      [montacargasIdNum]
    );

    if (montacargasExiste.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `El montacargas con número ${montacargasIdNum} no existe` 
      });
    }

    // Verificar si ya existe programa para este año y montacargas
    const existente = await pool.query(
      "SELECT id FROM mantenimientos_programados WHERE montacargas_id = $1 AND anio = $2",
      [montacargasIdNum, anioNum]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Ya existe un programa de mantenimiento para el montacargas ${montacargasIdNum} en el año ${anioNum}` 
      });
    }

    const mantenimientos = [];
    
    for (let mes = 1; mes <= 12; mes++) {
      const fecha = new Date(anioNum, mes - 1, diaNum);
      const tipo = getTipoMantenimiento(mes);
      
      try {
        const result = await pool.query(
          `INSERT INTO mantenimientos_programados 
           (montacargas_id, mes, anio, tipo, fecha) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en, status`,
          [montacargasIdNum, mes, anioNum, tipo, fecha]
        );
        mantenimientos.push(result.rows[0]);
      } catch (err) {
        console.error(`Error insertando mes ${mes}:`, err);
        // Rollback en caso de error
        for (let i = 1; i < mes; i++) {
          await pool.query(
            "DELETE FROM mantenimientos_programados WHERE montacargas_id = $1 AND anio = $2 AND mes = $3",
            [montacargasIdNum, anioNum, i]
          );
        }
        throw err;
      }
    }

    res.json({ 
      success: true, 
      message: "Programa anual creado automáticamente",
      mantenimientos 
    });
  } catch (err) {
    console.error("Error registrando programa:", err);
    res.status(500).json({ success: false, error: "Error al registrar programa" });
  }
});
// FIN DEL BLOQUE 3: Crear mantenimientos anuales automáticos 

// BLOQUE 4: Crear mantenimiento manual para un mes específico - SIN CAMBIOS
router.post("/manual", async (req, res) => {
  try {
    console.log("POST /api/mantenimientos/manual - Body:", req.body);
    
    const { anio, mes, dia, montacargasId, tipo } = req.body;

    if (!anio || !mes || !dia || !montacargasId || !tipo) {
      return res.status(400).json({ 
        success: false, 
        error: "Todos los campos son requeridos: anio, mes, dia, montacargasId, tipo" 
      });
    }

    const anioNum = parseInt(anio);
    const mesNum = parseInt(mes);
    const diaNum = parseInt(dia);
    const montacargasIdNum = parseInt(montacargasId);

    if (isNaN(anioNum) || isNaN(mesNum) || isNaN(diaNum) || isNaN(montacargasIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: "Todos los valores deben ser números válidos" 
      });
    }

    const fecha = new Date(anioNum, mesNum - 1, diaNum);
    
    // Verificar si ya existe mantenimiento para este mes
    const existente = await pool.query(
      "SELECT id FROM mantenimientos_programados WHERE montacargas_id = $1 AND anio = $2 AND mes = $3",
      [montacargasIdNum, anioNum, mesNum]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Ya existe un mantenimiento programado para el mes ${mesNum} del año ${anioNum}` 
      });
    }

    const result = await pool.query(
      `INSERT INTO mantenimientos_programados 
       (montacargas_id, mes, anio, tipo, fecha) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, creado_en, status`,
      [montacargasIdNum, mesNum, anioNum, tipo, fecha]
    );

    res.json({ 
      success: true, 
      message: `Mantenimiento ${tipo} creado para el mes ${mesNum}`,
      mantenimiento: result.rows[0]
    });
  } catch (err) {
    console.error("Error creando mantenimiento manual:", err);
    res.status(500).json({ success: false, error: "Error al crear mantenimiento manual" });
  }
});
// FIN DEL BLOQUE 4: Crear mantenimiento manual para un mes específico

// BLOQUE 5: Eliminar mantenimiento - SIN CAMBIOS
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM mantenimientos_programados WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Mantenimiento no encontrado" });
    }

    res.json({ success: true, message: "Mantenimiento eliminado correctamente", id: result.rows[0].id });
  } catch (err) {
    console.error("Error eliminando mantenimiento:", err);
    res.status(500).json({ success: false, error: "Error al eliminar mantenimiento" });
  }
});
// FIN DEL BLOQUE 5: Eliminar mantenimiento

// BLOQUE 6: Actualizar mantenimiento - MODIFICADO
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, fecha, tecnico_id, tecnico_nombre, observaciones } = req.body;

    console.log("Datos recibidos para actualizar:", { id, tipo, fecha, tecnico_id, tecnico_nombre, observaciones });

    // Validar campos requeridos
    if (!tipo || !fecha) {
      return res.status(400).json({ 
        success: false, 
        error: "Tipo y fecha son campos requeridos" 
      });
    }

    // Validar formato de fecha
    const fechaValida = new Date(fecha);
    if (isNaN(fechaValida.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: "Formato de fecha inválido" 
      });
    }

    // Extraer mes y año de la fecha
    const mes = fechaValida.getMonth() + 1;
    const anio = fechaValida.getFullYear();

    // Procesar tecnico_id
    let tecnicoIdValido = null;
    if (tecnico_id !== undefined && tecnico_id !== null && tecnico_id !== "") {
      const tecnicoIdParsed = parseInt(tecnico_id);
      if (!isNaN(tecnicoIdParsed)) {
        tecnicoIdValido = tecnicoIdParsed;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: "El ID del técnico debe ser un número válido" 
        });
      }
    }

    console.log("Datos validados para actualizar:", { 
      tipo, fecha, mes, anio, tecnico_id: tecnicoIdValido, tecnico_nombre, observaciones, id 
    });

    const result = await pool.query(
      `UPDATE mantenimientos_programados 
       SET tipo = $1, fecha = $2, mes = $3, anio = $4, tecnico_id = $5, 
           tecnico_nombre = $6, observaciones = $7
       WHERE id = $8 
       RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, 
                 tecnico_nombre, status, creado_en, completado_en, observaciones`,
      [tipo, fecha, mes, anio, tecnicoIdValido, tecnico_nombre, observaciones, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Mantenimiento no encontrado" 
      });
    }

    res.json({ 
      success: true, 
      mantenimiento: result.rows[0],
      message: "Mantenimiento actualizado correctamente"
    });

  } catch (err) {
    console.error("Error actualizando mantenimiento:", err);
    
    if (err.code === '22P02') {
      return res.status(400).json({ 
        success: false,
        error: "Error de tipo de datos: Verifica que el ID del técnico sea un número válido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Error interno del servidor al actualizar mantenimiento" 
    });
  }
});
// FIN DEL BLOQUE 6: Actualizar mantenimiento

// BLOQUE 7: Obtener mantenimientos del mes actual - MODIFICADO
router.get("/mes-actual", async (req, res) => {
  try {
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const result = await pool.query(
      `SELECT mp.*, m.numero as montacargas_numero, m."Marca" as marca, m."Modelo" as modelo
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       WHERE mp.mes = $1 AND mp.anio = $2
       ORDER BY mp.fecha`,
      [mesActual, anioActual]
    );

    res.json({ success: true, mantenimientos: result.rows });
  } catch (err) {
    console.error("Error obteniendo mantenimientos del mes:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});
// FIN DEL BLOQUE 7: Obtener mantenimientos del mes actual

// NUEVO BLOQUE 8: Actualizar estado del mantenimiento
// NUEVO BLOQUE 8: Actualizar estado del mantenimiento - VERSIÓN CORREGIDA
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      tecnico_id, 
      tecnico_nombre, 
      observaciones,
      // NUEVOS CAMPOS DEL CHECKLIST
      hora_inicio,
      hora_termino,
      actividades_pendientes,
      partes_faltantes,
      golpes_unidad,
      condiciones_pintura,
      respuestas_incidencias,
      // NUEVOS CAMPOS PARA FIRMA DEL CLIENTE
      firma_cliente_data,
      firma_cliente_nombre
    } = req.body;

    console.log("📥 Actualizando estado del mantenimiento con checklist:", { 
      id, status, tecnico_id, tecnico_nombre, observaciones,
      hora_inicio, hora_termino, actividades_pendientes, partes_faltantes,
      golpes_unidad, condiciones_pintura,
      respuestas_incidencias_count: respuestas_incidencias ? Object.keys(respuestas_incidencias).length : 0,
      firma_cliente_data: firma_cliente_data ? 'PRESENTE' : 'AUSENTE',
      firma_cliente_nombre
    });

    // Validar que el estado sea válido
    const estadosValidos = ['pendiente', 'completado', 'cancelado'];
    if (!status || !estadosValidos.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` 
      });
    }

    // Procesar tecnico_id
    let tecnicoIdValido = null;
    if (tecnico_id !== undefined && tecnico_id !== null && tecnico_id !== "") {
      const tecnicoIdParsed = parseInt(tecnico_id);
      if (!isNaN(tecnicoIdParsed)) {
        tecnicoIdValido = tecnicoIdParsed;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: "El ID del técnico debe ser un número válido" 
        });
      }
    }

    // VALIDACIÓN CRÍTICA: Limpiar respuestas_incidencias ANTES de procesar
    let respuestasIncidenciasLimpio = null;
    if (respuestas_incidencias) {
      respuestasIncidenciasLimpio = { ...respuestas_incidencias };
      
      // ELIMINAR campos que no son incidencias reales del checklist
      const camposNoIncidencia = [
        'firma_cliente_data', 'firma_cliente_nombre',
        'observaciones', 'actividadesPendientes', 'partesFaltantes', 
        'golpesUnidad', 'condicionesPintura', 'horaInicio', 'horaTermino',
        'tecnico', 'fecha', 'mantenimientoId'
      ];
      
      camposNoIncidencia.forEach(campo => {
        if (respuestasIncidenciasLimpio[campo]) {
          console.warn(`⚠️ Eliminando campo no incidencia de respuestas_incidencias: ${campo}`);
          delete respuestasIncidenciasLimpio[campo];
        }
      });

      console.log('🔍 Respuestas incidencias después de limpiar:', {
        original_count: Object.keys(respuestas_incidencias).length,
        limpio_count: Object.keys(respuestasIncidenciasLimpio).length,
        campos_eliminados: camposNoIncidencia.filter(campo => respuestas_incidencias[campo])
      });
    }

    // Procesar firma del cliente si está presente
    let firma_cliente_url = null;
    if (firma_cliente_data && firma_cliente_nombre) {
      try {
        console.log('✍️ Procesando firma del cliente...');
        
        // VALIDACIÓN EXTRA: Verificar que NO esté en incidencias después de limpiar
        if (respuestasIncidenciasLimpio && respuestasIncidenciasLimpio.firma_cliente_data) {
          console.warn('🚨 ADVERTENCIA CRÍTICA: firma_cliente_data todavía en incidencias después de limpiar. Eliminando...');
          delete respuestasIncidenciasLimpio.firma_cliente_data;
        }
        
        // Validar formato de firma
        if (!firma_cliente_data.startsWith('data:image/')) {
          throw new Error('Formato de firma inválido. Debe ser data URL de imagen.');
        }
        
        // Convertir base64 a buffer
        const base64Data = firma_cliente_data.replace(/^data:image\/\w+;base64,/, '');
        const firmaBuffer = Buffer.from(base64Data, 'base64');
        
        // Validar tamaño del buffer
        if (firmaBuffer.length === 0) {
          throw new Error('La firma está vacía');
        }
        
        console.log(`✅ Firma válida. Tamaño: ${firmaBuffer.length} bytes, Nombre: ${firma_cliente_nombre}`);
        
        // Subir firma a S3
        firma_cliente_url = await uploadImageToS3(
          firmaBuffer,
          `firma-cliente-${Date.now()}-${firma_cliente_nombre.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          'image/png'
        );
        
        console.log('✅ Firma del cliente subida a S3:', firma_cliente_url);
      } catch (firmaError) {
        console.error('❌ Error subiendo firma del cliente a S3:', firmaError);
        // No detenemos el proceso por error en la firma, pero registramos el problema
      }
    }

    // LOG FINAL PARA DEPURACIÓN
    console.log('📊 RESUMEN ANTES DE GUARDAR:', {
      incidencias_count: respuestasIncidenciasLimpio ? Object.keys(respuestasIncidenciasLimpio).length : 0,
      incidencias_keys: respuestasIncidenciasLimpio ? Object.keys(respuestasIncidenciasLimpio) : [],
      firma_url: firma_cliente_url,
      firma_nombre: firma_cliente_nombre,
      firma_en_incidencias: respuestasIncidenciasLimpio && 'firma_cliente_data' in respuestasIncidenciasLimpio
    });

    // INICIO TRANSACCIÓN - Actualizar mantenimiento Y guardar checklist
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. ACTUALIZAR EL MANTENIMIENTO
      let queryMantenimiento = `UPDATE mantenimientos_programados 
                               SET status = $1, tecnico_id = $2, tecnico_nombre = $3, observaciones = $4`;
      let paramsMantenimiento = [status, tecnicoIdValido, tecnico_nombre, observaciones];

      // Si se marca como completado, agregar fecha de completado
      if (status === 'completado') {
        queryMantenimiento += `, completado_en = NOW()`;
      } else if (status === 'pendiente') {
        queryMantenimiento += `, completado_en = NULL`;
      }

      queryMantenimiento += ` WHERE id = $${paramsMantenimiento.length + 1} 
                            RETURNING id, montacargas_id, mes, anio, tipo, fecha, tecnico_id, 
                                      tecnico_nombre, status, creado_en, completado_en, observaciones`;
      
      paramsMantenimiento.push(id);

      const resultMantenimiento = await client.query(queryMantenimiento, paramsMantenimiento);

      if (resultMantenimiento.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          error: "Mantenimiento no encontrado" 
        });
      }

      // 2. SI ES COMPLETADO Y HAY DATOS DE CHECKLIST, GUARDAR EL CHECKLIST
      let checklistResult = null;
      if (status === 'completado' && (hora_inicio || hora_termino || observaciones || actividades_pendientes || firma_cliente_url)) {
        const queryChecklist = `
          INSERT INTO checklists_completados (
            mantenimiento_id,
            tecnico_id,
            tecnico_nombre,
            hora_inicio,
            hora_termino,
            observaciones,
            actividades_pendientes,
            partes_faltantes,
            golpes_unidad,
            condiciones_pintura,
            respuestas_incidencias,
            firma_cliente_url,
            firma_cliente_nombre,
            firma_cliente_fecha
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;

        const paramsChecklist = [
          id, // mantenimiento_id
          tecnicoIdValido,
          tecnico_nombre,
          hora_inicio,
          hora_termino,
          observaciones,
          actividades_pendientes,
          partes_faltantes,
          golpes_unidad,
          condiciones_pintura,
          respuestasIncidenciasLimpio ? JSON.stringify(respuestasIncidenciasLimpio) : null, // USAR LA VERSIÓN LIMPIA
          firma_cliente_url,
          firma_cliente_nombre,
          firma_cliente_url ? new Date() : null
        ];

        console.log('💾 Guardando checklist en BD con:', {
          incidencias: respuestasIncidenciasLimpio ? Object.keys(respuestasIncidenciasLimpio).length : 0,
          firma_url_presente: !!firma_cliente_url,
          firma_nombre: firma_cliente_nombre
        });

        checklistResult = await client.query(queryChecklist, paramsChecklist);
        
        // LOG DETALLADO DEL RESULTADO
        console.log("✅ Checklist guardado en BD:", {
          id: checklistResult.rows[0].id,
          firma_cliente_url: checklistResult.rows[0].firma_cliente_url,
          firma_cliente_nombre: checklistResult.rows[0].firma_cliente_nombre,
          incidencias_count: checklistResult.rows[0].respuestas_incidencias ? Object.keys(checklistResult.rows[0].respuestas_incidencias).length : 0
        });
      }

      await client.query('COMMIT');

      // Respuesta exitosa
      const response = {
        success: true, 
        mantenimiento: resultMantenimiento.rows[0],
        message: `Mantenimiento ${status} correctamente`
      };

      // Si se guardó checklist, agregarlo a la respuesta
      if (checklistResult) {
        response.checklist = checklistResult.rows[0];
        response.message += ' y checklist guardado';
        
        // Si incluye firma del cliente
        if (firma_cliente_url) {
          response.message += ' con firma del cliente';
        }
      }

      // LOG FINAL DE ÉXITO
      console.log('🎉 OPERACIÓN COMPLETADA EXITOSAMENTE:', {
        mantenimiento_id: id,
        checklist_guardado: !!checklistResult,
        firma_incluida: !!firma_cliente_url,
        incidencias_guardadas: respuestasIncidenciasLimpio ? Object.keys(respuestasIncidenciasLimpio).length : 0
      });

      res.json(response);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en transacción:', error);
      throw error;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error("❌ Error actualizando estado del mantenimiento:", err);
    
    if (err.code === '22P02') {
      return res.status(400).json({ 
        success: false,
        error: "Error de tipo de datos: Verifica que el ID del técnico sea un número válido" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: "Error interno del servidor al actualizar estado" 
    });
  }
});
// FIN NUEVO BLOQUE 8: Actualizar estado del mantenimiento

// NUEVO BLOQUE 9: Obtener mantenimientos por estado
router.get("/estado/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validar estado
    const estadosValidos = ['pendiente', 'completado', 'cancelado'];
    if (!estadosValidos.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` 
      });
    }

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT mp.*, m.numero as montacargas_numero, m."Marca" as marca, m."Modelo" as modelo
       FROM mantenimientos_programados mp
       JOIN "Montacargas" m ON mp.montacargas_id = m.numero
       WHERE mp.status = $1
       ORDER BY mp.fecha DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    // Obtener total count para paginación
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM mantenimientos_programados WHERE status = $1`,
      [status]
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      success: true, 
      mantenimientos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error("Error obteniendo mantenimientos por estado:", err);
    res.status(500).json({ success: false, error: "Error al obtener mantenimientos" });
  }
});
// FIN NUEVO BLOQUE 9: Obtener mantenimientos por estado

// NUEVO BLOQUE 10: Obtener todos los checklists completados (para admin)
router.get("/checklists/completados", async (req, res) => {
  try {
    console.log("Obteniendo checklists completados del mes actual");
    
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    const query = `
      SELECT 
        cc.*,
        mp.montacargas_id as montacargas_numero,
        mp.tipo as tipo_mantenimiento,
        mp.fecha as fecha_programada,
        m."Marca" as montacargas_marca,
        m."Modelo" as montacargas_modelo,
        m."Serie" as montacargas_serie,
        m."Ubicacion" as montacargas_ubicacion,
        m."Planta" as montacargas_planta,
        -- INCLUIR EXPLÍCITAMENTE LOS CAMPOS DE FIRMA
        cc.firma_cliente_url,
        cc.firma_cliente_nombre,
        cc.firma_cliente_fecha
      FROM checklists_completados cc
      JOIN mantenimientos_programados mp ON cc.mantenimiento_id = mp.id
      JOIN "Montacargas" m ON mp.montacargas_id = m.numero
      WHERE EXTRACT(MONTH FROM cc.creado_en) = $1 
        AND EXTRACT(YEAR FROM cc.creado_en) = $2
      ORDER BY cc.creado_en DESC
    `;

    const result = await pool.query(query, [mesActual, anioActual]);
    
    console.log(`Encontrados ${result.rows.length} checklists completados para ${mesActual}/${anioActual}`);
    
    // DEBUG: Verificar si hay firmas en los resultados
    const checklistsConFirma = result.rows.filter(row => row.firma_cliente_url);
    console.log(`Checklists con firma: ${checklistsConFirma.length}`);
    checklistsConFirma.forEach((checklist, index) => {
      console.log(`Checklist ${index + 1}:`, {
        id: checklist.id,
        firma_url: checklist.firma_cliente_url,
        firma_nombre: checklist.firma_cliente_nombre,
        firma_fecha: checklist.firma_cliente_fecha
      });
    });
    
    res.json({
      success: true,
      checklists: result.rows,
      mes: mesActual,
      anio: anioActual
    });
  } catch (error) {
    console.error("Error obteniendo checklists completados:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;