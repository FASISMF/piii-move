import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Páginas */
import Splash from './pages/Splash';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import Dashboard from './pages/Dashboard';
import EscanerQR from './pages/EscanerQR';
import ResultadoQR from './pages/ResultadoQR';
import MiCodigoQR from './pages/MiCodigoQR';
import HistorialConversaciones from './pages/HistorialConversaciones';
import Chat from './pages/Chat';
import MiPerfil from './pages/MiPerfil';

/* Core CSS de Ionic */
import '@ionic/react/css/core.css';

/* CSS básico para apps Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* CSS opcional pero recomendado */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Ruta inicial - Splash */}
        <Route exact path="/">
          <Redirect to="/splash" />
        </Route>
        
        {/* Autenticación */}
        <Route exact path="/splash" component={Splash} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/registro" component={Registro} />
        <Route exact path="/recuperar-password" component={RecuperarPassword} />
        
        {/* App principal */}
        <Route exact path="/dashboard" component={Dashboard} />
        <Route exact path="/escaner-qr" component={EscanerQR} />
        <Route exact path="/resultado-qr/:usuarioId" component={ResultadoQR} />
        <Route exact path="/mi-codigo-qr" component={MiCodigoQR} />
        <Route exact path="/historial-conversaciones" component={HistorialConversaciones} />
        <Route exact path="/chat/:conversacionId/:usuarioId" component={Chat} />
        <Route exact path="/mi-perfil" component={MiPerfil} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;