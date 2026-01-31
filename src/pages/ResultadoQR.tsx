import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonText
} from '@ionic/react';
import { arrowBack, personCircleOutline, alertCircleOutline, chatbubbleOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import './ResultadoQR.css';

interface UsuarioEscaneado {
  uid: string;
  nombre: string;
  email: string;
}

interface LocationState {
  usuario: UsuarioEscaneado;
}

const ResultadoQR: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);

  const usuarioEscaneado = location.state?.usuario;
  const usuarioActual = auth.currentUser;

  // Si no hay datos del usuario escaneado, volver atrás
  if (!usuarioEscaneado) {
    history.replace('/escaner-qr');
    return null;
  }

  const enviarAviso = async () => {
    if (!usuarioActual) return;

    setEnviando(true);

    try {
      // Buscar si ya existe una conversación entre estos usuarios
      let conversacionId = await buscarConversacionExistente();

      // Si no existe, crear una nueva
      if (!conversacionId) {
        const nuevaConversacion = await addDoc(collection(db, 'conversaciones'), {
          participantes: [usuarioActual.uid, usuarioEscaneado.uid],
          creadoEn: new Date().toISOString(),
          ultimoMensaje: '¡Hola! Te he enviado un aviso.',
          ultimoMensajeFecha: new Date().toISOString()
        });
        conversacionId = nuevaConversacion.id;
      }

      // Enviar mensaje de aviso
      await addDoc(collection(db, 'mensajes'), {
        conversacionId: conversacionId,
        emisorId: usuarioActual.uid,
        receptorId: usuarioEscaneado.uid,
        texto: '¡Hola! Te he enviado un aviso desde Piii-Move!',
        tipo: 'aviso',
        fechaEnvio: new Date().toISOString(),
        leido: false
      });

      setMensajeEnviado(true);
    } catch (error) {
      console.error('Error al enviar aviso:', error);
    } finally {
      setEnviando(false);
    }
  };

  const buscarConversacionExistente = async (): Promise<string | null> => {
    if (!usuarioActual) return null;

    const conversacionesRef = collection(db, 'conversaciones');
    const q = query(
      conversacionesRef,
      where('participantes', 'array-contains', usuarioActual.uid)
    );

    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.participantes.includes(usuarioEscaneado.uid)) {
        return doc.id;
      }
    }

    return null;
  };

  const iniciarChat = async () => {
    if (!usuarioActual) return;

    let conversacionId = await buscarConversacionExistente();

    if (!conversacionId) {
      const nuevaConversacion = await addDoc(collection(db, 'conversaciones'), {
        participantes: [usuarioActual.uid, usuarioEscaneado.uid],
        creadoEn: new Date().toISOString(),
        ultimoMensaje: '',
        ultimoMensajeFecha: new Date().toISOString()
      });
      conversacionId = nuevaConversacion.id;
    }

    history.push('/chat', {
      conversacionId: conversacionId,
      usuario: usuarioEscaneado
    });
  };

  return (
    <IonPage>
      <IonContent className="resultado-container">
        <div className="resultado-content">
          <div className="resultado-header">
            <IonIcon 
              icon={arrowBack} 
              className="resultado-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="resultado-title">Usuario Detectado</h1>
          </div>

          <div className="resultado-usuario">
            <IonIcon icon={personCircleOutline} className="resultado-avatar" />
            <h2 className="resultado-nombre">{usuarioEscaneado.nombre}</h2>
            <IonText color="medium">Conductor de Piii-Move!</IonText>
          </div>

          {!mensajeEnviado ? (
            <div className="resultado-acciones">
              <IonButton 
                expand="block" 
                size="large"
                onClick={enviarAviso}
                disabled={enviando}
                className="resultado-btn-avisar"
              >
                <IonIcon icon={alertCircleOutline} slot="start" />
                {enviando ? 'Enviando...' : 'Avisar'}
              </IonButton>

              <IonButton 
                expand="block" 
                fill="outline"
                onClick={iniciarChat}
                className="resultado-btn-chat"
              >
                <IonIcon icon={chatbubbleOutline} slot="start" />
                Iniciar Conversación
              </IonButton>
            </div>
          ) : (
            <div className="resultado-exito">
              <IonIcon icon={alertCircleOutline} className="resultado-exito-icon" />
              <h3>¡Aviso enviado!</h3>
              <p>El conductor ha recibido tu notificación</p>
              
              <IonButton 
                expand="block" 
                onClick={iniciarChat}
                className="resultado-btn-chat-exito"
              >
                <IonIcon icon={chatbubbleOutline} slot="start" />
                Continuar al Chat
              </IonButton>

              <IonButton 
                expand="block" 
                fill="outline"
                onClick={() => history.replace('/dashboard')}
                className="resultado-btn-volver"
              >
                Volver al Inicio
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResultadoQR;