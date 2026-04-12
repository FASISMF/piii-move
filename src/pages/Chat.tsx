import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonFooter,
  IonToolbar,
  IonInput,
  IonButton,
  IonSpinner,
  useIonViewWillEnter,  // ← AÑADIR
  useIonViewWillLeave   // ← AÑADIR
} from '@ionic/react';
import { arrowBack, sendOutline, personCircleOutline } from 'ionicons/icons';
import { useState, useRef, useCallback } from 'react';  // ← QUITAR useEffect
import { useHistory, useParams } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import './Chat.css';

interface Mensaje {
  id: string;
  texto: string;
  emisorId: string;
  fechaEnvio: string;
  tipo?: string;
}

interface RouteParams {
  conversacionId: string;
  usuarioId: string;
}

const Chat: React.FC = () => {
  const history = useHistory();
  const { conversacionId, usuarioId } = useParams<RouteParams>();
  
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  
  const contentRef = useRef<HTMLIonContentElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const usuarioActual = auth.currentUser;

  // Función para cargar nombre del usuario
  const cargarNombreUsuario = useCallback(async () => {
    if (!usuarioId) return;
    
    try {
      const usuarioRef = doc(db, 'usuarios', usuarioId);
      const usuarioSnap = await getDoc(usuarioRef);
      
      if (usuarioSnap.exists()) {
        setNombreUsuario(usuarioSnap.data().nombre || 'Usuario');
      }
    } catch (err) {
      console.error('Error cargando nombre usuario:', err);
    }
  }, [usuarioId]);

  // Función para iniciar suscripción a mensajes
  const iniciarSuscripcion = useCallback(() => {
    if (!conversacionId || !usuarioId) {
      history.replace('/historial-conversaciones');
      return;
    }

    console.log('=== INICIANDO SUSCRIPCIÓN CHAT ===');
    console.log('conversacionId:', conversacionId);

    // Limpiar suscripción anterior si existe
    if (unsubscribeRef.current) {
      console.log('Limpiando suscripción anterior');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Resetear estados
    setCargando(true);
    setError(null);
    setMensajes([]);
    setNuevoMensaje('');
    setEnviando(false);

    try {
      const mensajesRef = collection(db, 'mensajes');
      const q = query(
        mensajesRef,
        where('conversacionId', '==', conversacionId),
        orderBy('fechaEnvio', 'asc')
      );

      unsubscribeRef.current = onSnapshot(
        q, 
        (snapshot) => {
          console.log('Mensajes recibidos:', snapshot.docs.length);
          const mensajesData: Mensaje[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            texto: docSnap.data().texto,
            emisorId: docSnap.data().emisorId,
            fechaEnvio: docSnap.data().fechaEnvio,
            tipo: docSnap.data().tipo
          }));
          
          setMensajes(mensajesData);
          setCargando(false);
          
          setTimeout(() => {
            contentRef.current?.scrollToBottom(300);
          }, 100);
        },
        (err) => {
          console.error('Error en suscripción de mensajes:', err);
          setError('Error al cargar mensajes');
          setCargando(false);
        }
      );
    } catch (err) {
      console.error('Error al configurar suscripción:', err);
      setError('Error al conectar con el chat');
      setCargando(false);
    }
  }, [conversacionId, usuarioId, history]);

  // Ejecutar al entrar a la vista
  useIonViewWillEnter(() => {
    console.log('=== CHAT: ION VIEW WILL ENTER ===');
    cargarNombreUsuario();
    iniciarSuscripcion();
  });

  // Limpiar al salir de la vista
  useIonViewWillLeave(() => {
    console.log('=== CHAT: ION VIEW WILL LEAVE ===');
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  });

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !usuarioActual || enviando || !conversacionId || !usuarioId) return;

    const textoMensaje = nuevoMensaje.trim();
    setNuevoMensaje('');
    setEnviando(true);

    try {
      await addDoc(collection(db, 'mensajes'), {
        conversacionId: conversacionId,
        emisorId: usuarioActual.uid,
        receptorId: usuarioId,
        texto: textoMensaje,
        tipo: 'texto',
        fechaEnvio: new Date().toISOString(),
        leido: false
      });

      const conversacionRef = doc(db, 'conversaciones', conversacionId);
      await updateDoc(conversacionRef, {
        ultimoMensaje: textoMensaje,
        ultimoMensajeFecha: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setNuevoMensaje(textoMensaje);
    } finally {
      setEnviando(false);
    }
  };

  const formatearHora = (fechaISO: string): string => {
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const esMiMensaje = (emisorId: string): boolean => {
    return emisorId === usuarioActual?.uid;
  };

  const volverAtras = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    history.push('/historial-conversaciones');
  };

  // Pantalla de carga si faltan parámetros
  if (!conversacionId || !usuarioId) {
    return (
      <IonPage>
        <IonContent className="chat-container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <div className="chat-header">
        <IonIcon 
          icon={arrowBack} 
          className="chat-back" 
          onClick={volverAtras}
        />
        <IonIcon icon={personCircleOutline} className="chat-avatar" />
        <div className="chat-header-info">
          <h1 className="chat-header-nombre">{nombreUsuario}</h1>
          <span className="chat-header-estado">Piii-Move!</span>
        </div>
      </div>

      <IonContent className="chat-container" ref={contentRef}>
        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50%' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : error ? (
          <div className="chat-vacio">
            <p>{error}</p>
          </div>
        ) : (
          <div className="chat-mensajes">
            {mensajes.length === 0 ? (
              <div className="chat-vacio">
                <p>No hay mensajes aún. ¡Envía el primero!</p>
              </div>
            ) : (
              mensajes.map((mensaje) => (
                <div 
                  key={mensaje.id}
                  className={`chat-burbuja ${esMiMensaje(mensaje.emisorId) ? 'enviado' : 'recibido'}`}
                >
                  <p className="chat-burbuja-texto">{mensaje.texto}</p>
                  <span className="chat-burbuja-hora">{formatearHora(mensaje.fechaEnvio)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </IonContent>

      <IonFooter className="chat-footer">
        <IonToolbar className="chat-toolbar">
          <div className="chat-input-container">
            <IonInput
              value={nuevoMensaje}
              placeholder="Escribe un mensaje..."
              onIonInput={(e) => setNuevoMensaje(e.detail.value || '')}
              onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
              className="chat-input"
              disabled={enviando}
            />
            <IonButton 
              fill="clear" 
              onClick={enviarMensaje}
              disabled={!nuevoMensaje.trim() || enviando}
              className="chat-btn-enviar"
            >
              {enviando ? (
                <IonSpinner name="crescent" style={{ width: '20px', height: '20px' }} />
              ) : (
                <IonIcon icon={sendOutline} />
              )}
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Chat;