// imageAnalysis.js
const sharp = require('sharp');

// Función para analizar LSB
const analyzeLSB = async (imageBuffer, format, blockSize = 100) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    console.log(`[+] Tamaño de la imagen: ${width}x${height} píxeles.`);
    console.log(`[INFO] Formato detectado: ${format.toUpperCase()}`);

    // Convertir la imagen a formato raw (RGBA)
    const rawData = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = rawData.data;

    // Extraer los LSBs de cada canal
    let vr = [], vg = [], vb = [];
    for (let i = 0; i < data.length; i += 4) {
      vr.push(data[i] & 1);       // Canal rojo
      vg.push(data[i + 1] & 1);   // Canal verde
      vb.push(data[i + 2] & 1);   // Canal azul
    }

    // Determinar umbrales dinámicos según el formato
    let lowerThreshold, upperThreshold, maxSuspiciousProportion;
    if (format === "jpeg") {
      lowerThreshold = 0.4;
      upperThreshold = 0.6;
      maxSuspiciousProportion = 0.3; // Permitir hasta un 30% de bloques sospechosos
      console.log("[INFO] Aplicando umbrales para JPG.");
    } else if (format === "png") {
      lowerThreshold = 0.45;
      upperThreshold = 0.55;
      maxSuspiciousProportion = 0.35; // Permitir hasta un 35% de bloques sospechosos
      console.log("[INFO] Aplicando umbrales para PNG.");
    } else {
      lowerThreshold = 0.45;
      upperThreshold = 0.55;
      maxSuspiciousProportion = 0.4; // Umbrales generales
      console.log("[INFO] Aplicando umbrales generales.");
    }

    // Calcular promedios de LSB por bloques
    const calculateBlockAverages = (data) => {
      const averages = [];
      for (let i = 0; i < data.length; i += blockSize) {
        const block = data.slice(i, i + blockSize);
        averages.push(block.reduce((sum, bit) => sum + bit, 0) / block.length);
      }
      return averages;
    };

    const avgR = calculateBlockAverages(vr);
    const avgG = calculateBlockAverages(vg);
    const avgB = calculateBlockAverages(vb);

    const totalBlocks = avgR.length;

    // Detectar bloques sospechosos (en este ejemplo usamos el canal azul, vb)
    const suspectBlocks = avgB.filter(
      (avg) => avg > lowerThreshold && avg < upperThreshold
    ).length;

    // Evaluar si la imagen es sospechosa
    const suspiciousProportion = suspectBlocks / totalBlocks;
    const isSuspicious = suspiciousProportion > maxSuspiciousProportion;

    console.log(`[+] Bloques sospechosos detectados: ${suspectBlocks} / ${totalBlocks}`);
    console.log(`[INFO] Proporción sospechosa: ${suspiciousProportion}`);
    console.log(`[INFO] Umbrales utilizados: ${lowerThreshold} - ${upperThreshold}`);

    return {
      isSuspicious,
      suspectBlocks,
      totalBlocks,
      suspiciousProportion,
      maxSuspiciousProportion,
      thresholds: { lower: lowerThreshold, upper: upperThreshold },
    };
  } catch (error) {
    console.error(`[ERROR] Error en el análisis LSB: ${error.message}`);
    throw error;
  }
};

module.exports = {
  analyzeLSB,
};
