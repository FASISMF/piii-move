import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/react';
import { arrowBack, chatbubbleEllipsesOutline, personCircleOutline } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import './HistorialConversaciones.css';

interface Conversacion {
  id: string;
  participantes: string[];
  ultimoMensaje: string;
  ultimoMensajeFecha: string;
  otroUsuario?: {
    uid: string;
    nombre: string;
  };
}

const HistorialConversaciones: React.FC = () => {
  const history = useHistory();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const usuarioActual = auth.currentUser;

  useEffect(() => {
    cargarConversaciones();
  }, []);

  const cargarConversaciones = async () => {
    if (!usuarioActual) return;

    try {
      const conversacionesRef = collection(db, 'conversaciones');
      const q = query(
        conversacionesRef,
        where('participantes', 'array-contains', usuarioActual.uid)
      );

      const snapshot = await getDocs(q);
      const conversacionesData: Conversacion[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Obtener datos del otro participante
        const otroUsuarioId = data.participantes.find(
          (p: string) => p !== usuarioActual.uid
        );

        let otroUsuario = { uid: otroUsuarioId, nombre: 'Usuario' };

        if (otroUsuarioId) {
          const usuarioRef = doc(db, 'usuarios', otroUsuarioId);
          const usuarioSnap = await getDoc(usuarioRef);
          if (usuarioSnap.exists()) {
            otroUsuario = {
              uid: otroUsuarioId,
              nombre: usuarioSnap.data().nombre || 'Usuario'
            };
          }
        }

        conversacionesData.push({
          id: docSnap.id,
          participantes: data.participantes,
          ultimoMensaje: data.ultimoMensaje || 'Sin mensajes',
          ultimoMensajeFecha: data.ultimoMensajeFecha,
          otroUsuario
        });
      }

      // Ordenar por fecha del último mensaje (más reciente primero)
      conversacionesData.sort((a, b) => 
        new Date(b.ultimoMensajeFecha).getTime() - new Date(a.ultimoMensajeFecha).getTime()
      );

      setConversaciones(conversacionesData);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias === 0) {
      return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (dias === 1) {
      return 'Ayer';
    } else if (dias < 7) {
      return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    } else {
      return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const abrirChat = (conversacion: Conversacion) => {
    history.push('/chat', {
      conversacionId: conversacion.id,
      usuario: conversacion.otroUsuario
    });
  };

  return (
    <IonPage>
      <IonContent className="historial-container">
        <div className="historial-content">
          <div className="historial-header">
            <IonIcon 
              icon={arrowBack} 
              className="historial-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="historial-title">Conversaciones</h1>
          </div>

          {cargando ? (
            <div className="historial-cargando">
              <IonSpinner name="crescent" />
              <p>Cargando conversaciones...</p>
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="historial-vacio">
              <IonIcon icon={chatbubbleEllipsesOutline} className="historial-vacio-icon" />
              <h3>Sin conversaciones</h3>
              <p>Escanea un código QR para iniciar tu primera conversación</p>
            </div>
          ) : (
            <div className="historial-lista">
              {conversaciones.map((conv) => (
                <div 
                  key={conv.id} 
                  className="historial-item"
                  onClick={() => abrirChat(conv)}
                >
                  <IonIcon icon={personCircleOutline} className="historial-item-avatar" />
                  <div className="historial-item-info">
                    <h3 className="historial-item-nombre">{conv.otroUsuario?.nombre}</h3>
                    <p className="historial-item-mensaje">{conv.ultimoMensaje}</p>
                  </div>
                  <span className="historial-item-fecha">
                    {formatearFecha(conv.ultimoMensajeFecha)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HistorialConversaciones;