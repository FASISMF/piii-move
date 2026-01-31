import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonFooter,
  IonToolbar,
  IonInput,
  IonButton
} from '@ionic/react';
import { arrowBack, sendOutline, personCircleOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc
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

interface Usuario {
  uid: string;
  nombre: string;
}

interface LocationState {
  conversacionId: string;
  usuario: Usuario;
}

const Chat: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);

  const conversacionId = location.state?.conversacionId;
  const otroUsuario = location.state?.usuario;
  const usuarioActual = auth.currentUser;

  // Si no hay datos, volver atrás
  if (!conversacionId || !otroUsuario) {
    history.replace('/historial-conversaciones');
    return null;
  }

  useEffect(() => {
    // Suscripción en tiempo real a los mensajes
    const mensajesRef = collection(db, 'mensajes');
    const q = query(
      mensajesRef,
      where('conversacionId', '==', conversacionId),
      orderBy('fechaEnvio', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajesData: Mensaje[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Mensaje));
      
      setMensajes(mensajesData);
      
      // Scroll al final cuando llegan nuevos mensajes
      setTimeout(() => {
        contentRef.current?.scrollToBottom(300);
      }, 100);
    });

    return () => unsubscribe();
  }, [conversacionId]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !usuarioActual || enviando) return;

    const textoMensaje = nuevoMensaje.trim();
    setNuevoMensaje('');
    setEnviando(true);

    try {
      // Añadir mensaje a la colección
      await addDoc(collection(db, 'mensajes'), {
        conversacionId: conversacionId,
        emisorId: usuarioActual.uid,
        receptorId: otroUsuario.uid,
        texto: textoMensaje,
        tipo: 'texto',
        fechaEnvio: new Date().toISOString(),
        leido: false
      });

      // Actualizar último mensaje en la conversación
      const conversacionRef = doc(db, 'conversaciones', conversacionId);
      await updateDoc(conversacionRef, {
        ultimoMensaje: textoMensaje,
        ultimoMensajeFecha: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setNuevoMensaje(textoMensaje); // Restaurar mensaje si falla
    } finally {
      setEnviando(false);
    }
  };

  const formatearHora = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const esMiMensaje = (emisorId: string): boolean => {
    return emisorId === usuarioActual?.uid;
  };

  return (
    <IonPage>
      <div className="chat-header">
        <IonIcon 
          icon={arrowBack} 
          className="chat-back" 
          onClick={() => history.goBack()}
        />
        <IonIcon icon={personCircleOutline} className="chat-avatar" />
        <div className="chat-header-info">
          <h1 className="chat-header-nombre">{otroUsuario.nombre}</h1>
          <span className="chat-header-estado">Piii-Move!</span>
        </div>
      </div>

      <IonContent className="chat-container" ref={contentRef}>
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
      </IonContent>

      <IonFooter className="chat-footer">
        <IonToolbar className="chat-toolbar">
          <div className="chat-input-container">
            <IonInput
              value={nuevoMensaje}
              placeholder="Escribe un mensaje..."
              onIonInput={(e) => setNuevoMensaje(e.detail.value!)}
              onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
              className="chat-input"
            />
            <IonButton 
              fill="clear" 
              onClick={enviarMensaje}
              disabled={!nuevoMensaje.trim() || enviando}
              className="chat-btn-enviar"
            >
              <IonIcon icon={sendOutline} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Chat;