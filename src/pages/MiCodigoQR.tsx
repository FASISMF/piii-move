import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonSpinner
} from '@ionic/react';
import { arrowBack, sunnyOutline, downloadOutline } from 'ionicons/icons';
import { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '../services/firebase';
import jsPDF from 'jspdf';
import './MiCodigoQR.css';

const MiCodigoQR: React.FC = () => {
  const history = useHistory();
  const [brilloAlto, setBrilloAlto] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const usuario = auth.currentUser;

  const toggleBrillo = () => {
    setBrilloAlto(!brilloAlto);
  };

  const generarPDF = async () => {
    if (!usuario || !qrRef.current) return;

    setGenerandoPDF(true);

    try {
      // Obtener el SVG del QR
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('No se encontró el código QR');
      }

      // Convertir SVG a imagen
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Crear canvas para convertir a PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const qrSize = 600; // Tamaño grande para buena calidad
        canvas.width = qrSize;
        canvas.height = qrSize;

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, qrSize, qrSize);
          ctx.drawImage(img, 0, 0, qrSize, qrSize);

          const qrDataUrl = canvas.toDataURL('image/png');

          // Crear PDF tamaño cuadrado (10cm x 10cm aproximadamente)
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [100, 105]
          });

          const pageWidth = 100;
          const pageHeight = 105;

          // Línea de corte punteada (borde)
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineDashPattern([2, 2], 0);
          pdf.roundedRect(3, 3, pageWidth - 6, pageHeight - 6, 3, 3, 'S');

          // Reset línea normal
          pdf.setLineDashPattern([], 0);

          // QR centrado y grande
          const qrPdfSize = 65;
          const qrX = (pageWidth - qrPdfSize) / 2;
          const qrY = 8;
          pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrPdfSize, qrPdfSize);

          // Cargar logo
          const logoImg = new Image();
          logoImg.onload = () => {
            // Logo centrado con textos
            const logoSize = 18;
            const logoX = 15;
            const logoY = 76;
            
            // Crear canvas para el logo
            const logoCanvas = document.createElement('canvas');
            const logoCtx = logoCanvas.getContext('2d');
            logoCanvas.width = logoImg.width;
            logoCanvas.height = logoImg.height;
            if (logoCtx) {
              logoCtx.drawImage(logoImg, 0, 0);
              const logoDataUrl = logoCanvas.toDataURL('image/png');
              pdf.addImage(logoDataUrl, 'PNG', logoX, logoY, logoSize, logoSize);
            }

            // Textos a la derecha del logo
            const textoX = 35;
            
            // www.piii-move.net
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(80, 80, 80);
            pdf.text('www.piii-move.net', textoX, 82);

            // ID del código
            pdf.setFontSize(6);
            pdf.setFont('courier', 'normal');
            pdf.setTextColor(120, 120, 120);
            pdf.text(`ID: ${usuario.uid}`, textoX, 88);

            // Línea separadora
            pdf.setDrawColor(230, 230, 230);
            pdf.line(10, 94, pageWidth - 10, 94);

            // Texto "Escanéame"
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Escanéame con Piii-Move!', pageWidth / 2, 100, { align: 'center' });

            // Descargar PDF
            const nombreArchivo = `QR_PiiiMove_${usuario.displayName?.replace(/\s+/g, '_') || 'usuario'}.pdf`;
            pdf.save(nombreArchivo);
            setGenerandoPDF(false);
          };

          logoImg.onerror = () => {
            // Si falla el logo, generar sin él
            console.warn('No se pudo cargar el logo, generando sin él');
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(239, 159, 39);
            pdf.text('Piii', 12, 82);
            pdf.setTextColor(55, 138, 221);
            pdf.text('-Move!', 21, 82);

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text('www.piii-move.net', 45, 82);

            pdf.setFontSize(6);
            pdf.setFont('courier', 'normal');
            pdf.setTextColor(120, 120, 120);
            pdf.text(`ID: ${usuario.uid}`, 12, 88);

            pdf.setDrawColor(230, 230, 230);
            pdf.line(10, 94, pageWidth - 10, 94);

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text('Escanéame con Piii-Move!', pageWidth / 2, 100, { align: 'center' });

            const nombreArchivo = `QR_PiiiMove_${usuario.displayName?.replace(/\s+/g, '_') || 'usuario'}.pdf`;
            pdf.save(nombreArchivo);
            setGenerandoPDF(false);
          };

          logoImg.src = '/assets/logo_piii_move.png';
        }

        URL.revokeObjectURL(svgUrl);
      };

      img.onerror = () => {
        console.error('Error cargando imagen QR');
        setGenerandoPDF(false);
      };

      img.src = svgUrl;

    } catch (error) {
      console.error('Error generando PDF:', error);
      setGenerandoPDF(false);
    }
  };

  return (
    <IonPage>
      <IonContent className={`miqr-container ${brilloAlto ? 'brillo-alto' : ''}`}>
        <div className="miqr-content">
          <div className="miqr-header">
            <IonIcon 
              icon={arrowBack} 
              className="miqr-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="miqr-title">Mi Código QR</h1>
            <IonIcon 
              icon={sunnyOutline} 
              className={`miqr-brillo ${brilloAlto ? 'activo' : ''}`}
              onClick={toggleBrillo}
            />
          </div>

          <div className="miqr-info">
            <p>Muestra este código para que otros conductores puedan contactarte</p>
          </div>

          <div className="miqr-codigo-container">
            <div className="miqr-codigo" ref={qrRef}>
              {usuario ? (
                <QRCodeSVG 
                  value={usuario.uid}
                  size={220}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                />
              ) : (
                <p>Cargando...</p>
              )}
            </div>
            <h2 className="miqr-nombre">{usuario?.displayName || 'Usuario'}</h2>
            <p className="miqr-subtitulo">Piii-Move!</p>
          </div>

          {/* Botón Generar PDF */}
          <IonButton 
            expand="block"
            onClick={generarPDF}
            disabled={generandoPDF || !usuario}
            className="miqr-btn-pdf"
          >
            {generandoPDF ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: '10px', width: '20px', height: '20px' }} />
                Generando...
              </>
            ) : (
              <>
                <IonIcon icon={downloadOutline} slot="start" />
                Generar PDF para imprimir
              </>
            )}
          </IonButton>

          <div className="miqr-instrucciones">
            <h3>¿Cómo usar tu código?</h3>
            <ol>
              <li>Pulsa "Generar PDF" y descarga tu código</li>
              <li>Imprímelo y recórtalo por la línea punteada</li>
              <li>Colócalo en un lugar visible de tu vehículo</li>
              <li>¡Otros conductores podrán escanearlo con la app!</li>
            </ol>
          </div>

          <IonButton 
            expand="block" 
            fill="outline"
            onClick={() => history.replace('/dashboard')}
            className="miqr-btn-volver"
          >
            Volver al Inicio
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MiCodigoQR;