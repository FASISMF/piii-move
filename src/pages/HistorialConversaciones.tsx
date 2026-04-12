import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { arrowBack, chatbubbleEllipsesOutline, personCircleOutline } from 'ionicons/icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  doc, 
  getDoc, 
  onSnapshot,
  orderBy 
} from 'firebase/firestore';
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

// Cache para usuarios ya consultados
const usuariosCache: Map<string, { uid: string; nombre: string }> = new Map();

const HistorialConversaciones: React.FC = () => {
  const history = useHistory();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const usuarioActual = auth.currentUser;
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Función para obtener datos de usuario (con cache)
  const obtenerUsuario = useCallback(async (uid: string): Promise<{ uid: string; nombre: string }> => {
    // Revisar cache primero
    if (usuariosCache.has(uid)) {
      return usuariosCache.get(uid)!;
    }

    try {
      const usuarioRef = doc(db, 'usuarios', uid);
      const usuarioSnap = await getDoc(usuarioRef);
      
      const usuario = {
        uid,
        nombre: usuarioSnap.exists() ? (usuarioSnap.data().nombre || 'Usuario') : 'Usuario'
      };
      
      // Guardar en cache
      usuariosCache.set(uid, usuario);
      return usuario;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return { uid, nombre: 'Usuario' };
    }
  }, []);

  // Suscripción reactiva a conversaciones
  useEffect(() => {
    if (!usuarioActual) {
      setCargando(false);
      return;
    }

    setCargando(true);

    const conversacionesRef = collection(db, 'conversaciones');
    const q = query(
      conversacionesRef,
      where('participantes', 'array-contains', usuarioActual.uid)
    );

    // Suscripción en tiempo real
    unsubscribeRef.current = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const conversacionesPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            
            // Obtener el otro participante
            const otroUsuarioId = data.participantes.find(
              (p: string) => p !== usuarioActual.uid
            );

            const otroUsuario = otroUsuarioId 
              ? await obtenerUsuario(otroUsuarioId)
              : { uid: '', nombre: 'Usuario' };

            return {
              id: docSnap.id,
              participantes: data.participantes,
              ultimoMensaje: data.ultimoMensaje || 'Sin mensajes',
              ultimoMensajeFecha: data.ultimoMensajeFecha || new Date().toISOString(),
              otroUsuario
            } as Conversacion;
          });

          const conversacionesData = await Promise.all(conversacionesPromises);

          // Ordenar por fecha del último mensaje (más reciente primero)
          conversacionesData.sort((a, b) => 
            new Date(b.ultimoMensajeFecha).getTime() - new Date(a.ultimoMensajeFecha).getTime()
          );

          setConversaciones(conversacionesData);
        } catch (error) {
          console.error('Error procesando conversaciones:', error);
        } finally {
          setCargando(false);
        }
      },
      (error) => {
        console.error('Error en suscripción de conversaciones:', error);
        setCargando(false);
      }
    );

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [usuarioActual, obtenerUsuario]);

  const formatearFecha = (fechaISO: string): string => {
    try {
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
    } catch {
      return '';
    }
  };

    const abrirChat = (conversacion: Conversacion) => {
    history.push(`/chat/${conversacion.id}/${conversacion.otroUsuario?.uid}`);
    };

  const volverAtras = () => {
    // Limpiar suscripción antes de navegar
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    history.push('/dashboard');
  };

  return (
    <IonPage>
      <IonContent className="historial-container">
        <div className="historial-content">
          <div className="historial-header">
            <IonIcon 
              icon={arrowBack} 
              className="historial-back" 
              onClick={volverAtras}
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