import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, AlertTriangle, CheckCircle, Clock, X, MapPin, Check, 
  LayoutDashboard, ClipboardList, MessageSquare, Users, LogIn, LogOut, 
  FileText, ShieldAlert, Download, Send, WifiOff, Search, CheckSquare, 
  Bell, RefreshCw, Shield, Mic, Plus, Save 
} from 'lucide-react';
import * as QrModule from '@yudiel/react-qr-scanner';
import { supabase } from './supabaseClient';
import './styles.css';

// Compatibilidad de importación para el escáner
const Scanner = QrModule.Scanner || QrModule.default || QrModule;

// Icono Candado SVG nativo
const CandadoIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Zonas habituales de rondas diarias
const ZONAS_HABITUALES = ['Aseos Galería P0', 'Pasillo Principal', 'Parking Subterráneo'];

// --- HELPER RGPD: OBTENCIÓN SEGURA DE FOTOS MEDIANTE URL FIRMADA (Art. 32 LOPD-GDD) ---
export const obtenerUrlSegura = async (rutaArchivo) => {
  if (!rutaArchivo) return null;
  if (rutaArchivo.startsWith('data:image')) return rutaArchivo;

  const nombreLimpio = rutaArchivo.includes('/') ? rutaArchivo.split('/').pop() : rutaArchivo;
  const { data, error } = await supabase.storage.from('incidencias-fotos').createSignedUrl(nombreLimpio, 3600);
  
  if (error) {
    console.error("Error capa seguridad fotos:", error.message);
    return null;
  }
  return data?.signedUrl;
};

// --- COMPONENTE RGPD: RENDERIZADOR DE IMAGEN BLINDADA ---
const ImagenSegura = ({ ruta, alt, className }) => {
  const [url, setUrl] = React.useState(null);

  React.useEffect(() => {
    let montado = true;
    if (ruta) {
      obtenerUrlSegura(ruta).then(urlFirmada => {
        if (montado && urlFirmada) setUrl(urlFirmada);
      });
    }
    return () => { montado = false; };
  }, [ruta]);

  if (!url) return <div className={`bg-gray-200 animate-pulse flex items-center justify-center text-[10px] text-gray-500 ${className}`}>Cargando evidencia segura...</div>;
  return <img src={url} alt={alt} className={className} />;
};
// -------------------------------------------------------------------------------------

export function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Formulario Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navegación
  const [activeTab, setActiveTab] = useState('operario'); 

  // Incidencias y BD General
  const [incidenciasList, setIncidenciasList] = useState([]);
  const [historialFichajes, setHistorialFichajes] = useState([]);
  const [checklistHistorial, setChecklistHistorial] = useState([]);
  const [partesSeguridadList, setPartesSeguridadList] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('Todas'); 
  
  // UI Estados
  const [isScanning, setIsScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Formulario Incidencias
  const [zonaNombre, setZonaNombre] = useState('');
  const [titulo, setTitulo] = useState('');
  const [prioridad, setPrioridad] = useState('P3-Media');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [departamentoDestino, setDepartamentoDestino] = useState('');

  // Detalle y Chat
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [accionActiva, setAccionActiva] = useState(null); 
  const [chatMessages, setChatMessages] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const chatBottomRef = useRef(null);
  const [mensajesLeidos, setMensajesLeidos] = useState({});

  // Resolución y Pausa
  const [fotoDespuesFile, setFotoDespuesFile] = useState(null);
  const [fotoDespuesPreview, setFotoDespuesPreview] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [motivoPendiente, setMotivoPendiente] = useState('');

  // Checklist Operativo y Rondas
  const [showModalRonda, setShowModalRonda] = useState(false);
  const [rondaFormZona, setRondaFormZona] = useState(ZONAS_HABITUALES[0]);
  const [rondaFormOperario, setRondaFormOperario] = useState('');
  const [rondaFormHora, setRondaFormHora] = useState('');

  // Parte Diario de Seguridad
  const [showParteSeguridad, setShowParteSeguridad] = useState(false);
  const [parteId, setParteId] = useState(null);
  const [parteFecha, setParteFecha] = useState('');
  const [parteEstado, setParteEstado] = useState('Abierto');
  const [pestañaTurnoVer, setPestañaTurnoVer] = useState('Mañana');
  const [turnoEnCurso, setTurnoEnCurso] = useState('Mañana');
  
  const [datosTurnos, setDatosTurnos] = useState({
    Mañana: { vigilante_nombre: '', vigilante_tip: '', novedades: [], cerrado: false },
    Tarde: { vigilante_nombre: '', vigilante_tip: '', novedades: [], cerrado: false },
    Noche: { vigilante_nombre: '', vigilante_tip: '', novedades: [], cerrado: false }
  });

  const [nuevaEntradaHora, setNuevaEntradaHora] = useState('');
  const [nuevaEntradaTexto, setNuevaEntradaTexto] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const getTurnoYFechaOperativa = () => {
    const ahora = new Date();
    const h = ahora.getHours();
    const m = ahora.getMinutes();
    const hm = h * 100 + m; 
    let turno = 'Mañana';
    let fechaObj = new Date(ahora);

    if (hm >= 615 && hm < 1415) turno = 'Mañana';
    else if (hm >= 1415 && hm < 2215) turno = 'Tarde';
    else {
      turno = 'Noche';
      if (hm < 615) fechaObj.setDate(fechaObj.getDate() - 1);
    }
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    return { turnoDefault: turno, fechaISO: `${year}-${month}-${day}` };
  };

  useEffect(() => {
    const memoria = localStorage.getItem('pm_mensajes_leidos');
    if (memoria) setMensajesLeidos(JSON.parse(memoria));
  }, []);

  useEffect(() => {
    if (incidenciaSeleccionada && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, incidenciaSeleccionada]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { 
      window.removeEventListener('online', handleOnline); 
      window.removeEventListener('offline', handleOffline); 
    };
  }, []);

  const cargarPerfil = async (user) => {
    try {
      const { data, error } = await supabase.from('perfiles_usuarios').select('*').eq('id', user.id).single();
      if (!error && data) {
        setUserProfile(data);
        setActiveTab(data.rol === 'Gerencia' ? 'gerencia' : 'operario');
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) cargarPerfil(session.user);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) cargarPerfil(session.user);
      else { setUserProfile(null); }
      setLoadingSession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true); setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas.' : `Error de conexión: ${error.message}`);
    setIsLoggingIn(false);
  };
  
  // --- ACTUALIZACIÓN RGPD: Purga estricta al cerrar sesión ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error en cierre de sesión:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setUserProfile(null);
      setSession(null);
    }
  };

  const cargarDatos = async () => {
    try {
      const { data: incidencias } = await supabase.from('incidencias').select('*, comentarios(id)').order('fecha_creacion', { ascending: false }).limit(100);
      if (incidencias) setIncidenciasList(incidencias);

      const { data: fichajes } = await supabase.from('fichajes').select('*').order('fecha_hora', { ascending: false }).limit(20);
      if (fichajes) setHistorialFichajes(fichajes);

      const { data: rondas } = await supabase.from('rondas_checklist').select('*').order('fecha', { ascending: false }).limit(20);
      if (rondas) setChecklistHistorial(rondas);

      if (userProfile?.rol === 'Gerencia') {
        const { data: partes } = await supabase.from('partes_seguridad').select('*').order('fecha', { ascending: false }).limit(50);
        if (partes) setPartesSeguridadList(partes);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if (!session || !isOnline) return;
    cargarDatos();
    const intervalo = setInterval(() => cargarDatos(), 6000);
    const canalRealtime = supabase.channel('cambios-bd-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias' }, () => cargarDatos())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios' }, () => cargarDatos())
      .subscribe();
    return () => { clearInterval(intervalo); supabase.removeChannel(canalRealtime); };
  }, [session, isOnline, userProfile]);

  const miRol = userProfile?.rol || 'Mantenimiento';
  const esLimpieza = miRol === 'Limpieza';
  const esSeguridad = miRol === 'Seguridad';
  const esGerente = miRol === 'Gerencia';

  // Lógica de cálculo de Rondas Diarias para la fecha actual
  const esFechaDeHoy = (fechaStr) => {
    if (!fechaStr) return false;
    const f = new Date(fechaStr);
    const hoy = new Date();
    return f.getFullYear() === hoy.getFullYear() &&
           f.getMonth() === hoy.getMonth() &&
           f.getDate() === hoy.getDate();
  };

  const rondasDeHoy = checklistHistorial.filter(r => esFechaDeHoy(r.fecha));
  const zonasCompletadasHoy = rondasDeHoy.map(r => r.zona);
  const zonasPendientesHoy = ZONAS_HABITUALES.filter(z => !zonasCompletadasHoy.includes(z));

  const abrirModalParte = async () => {
    const { turnoDefault, fechaISO } = getTurnoYFechaOperativa();
    setTurnoEnCurso(turnoDefault);
    setPestañaTurnoVer(turnoDefault);
    setParteFecha(fechaISO);

    const ahora = new Date();
    setNuevaEntradaHora(`${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`);

    try {
      const { data, error } = await supabase.from('partes_seguridad').select('*').eq('fecha', fechaISO).maybeSingle();
      if (!error && data) {
        setParteId(data.id);
        setParteEstado(data.estado || 'Abierto');
        setDatosTurnos({
          Mañana: data.turno_manana || { vigilante_nombre: '', vigilante_tip: '', novedades: [], cerrado: false },
          Tarde: data.turno_tarde || { vigilante_nombre: '', vigilante_tip: '', novedades: [], cerrado: false },
          Noche: data.turno_noche || { vigilante_nombre: '', vigilante_tip: '', novedades: [], cerrado: false }
        });

        if (!data[`turno_${turnoDefault.toLowerCase()}`]?.vigilante_nombre && userProfile?.nombre_completo) {
          setDatosTurnos(prev => ({ ...prev, [turnoDefault]: { ...prev[turnoDefault], vigilante_nombre: userProfile.nombre_completo } }));
        }
      } else {
        setParteId(null);
        setParteEstado('Abierto');
        setDatosTurnos({
          Mañana: { vigilante_nombre: turnoDefault === 'Mañana' ? (userProfile?.nombre_completo || '') : '', vigilante_tip: '', novedades: [], cerrado: false },
          Tarde: { vigilante_nombre: turnoDefault === 'Tarde' ? (userProfile?.nombre_completo || '') : '', vigilante_tip: '', novedades: [], cerrado: false },
          Noche: { vigilante_nombre: turnoDefault === 'Noche' ? (userProfile?.nombre_completo || '') : '', vigilante_tip: '', novedades: [], cerrado: false }
        });
      }
    } catch (err) { console.error(err); }
    setShowParteSeguridad(true);
  };

  const agregarNovedadTurno = () => {
    if (!nuevaEntradaHora || !nuevaEntradaTexto.trim()) return alert('Indica la hora y novedad.');
    setDatosTurnos(prev => ({
      ...prev,
      [pestañaTurnoVer]: {
        ...prev[pestañaTurnoVer],
        novedades: [...prev[pestañaTurnoVer].novedades, { id: Date.now(), hora: nuevaEntradaHora, texto: nuevaEntradaTexto.trim() }]
      }
    }));
    setNuevaEntradaTexto('');
    const ahora = new Date();
    setNuevaEntradaHora(`${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`);
  };

  const eliminarNovedadTurno = (id) => {
    setDatosTurnos(prev => ({
      ...prev,
      [pestañaTurnoVer]: {
        ...prev[pestañaTurnoVer],
        novedades: prev[pestañaTurnoVer].novedades.filter(n => n.id !== id)
      }
    }));
  };

  const alternarDictado = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Tu navegador no soporta dictado directo. Usa el micro del teclado.');

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcripcion = event.results[0][0].transcript;
      setNuevaEntradaTexto(prev => prev ? prev + ' ' + transcripcion : transcripcion);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const guardarAvanceParte = async (turno) => {
    const turnoDatos = datosTurnos[turno];
    if (!turnoDatos.vigilante_nombre.trim() || !turnoDatos.vigilante_tip.trim()) {
      return alert(`Indica tu Nombre y nº de TIP en el turno de ${turno} antes de guardar.`);
    }

    setIsSubmitting(true);
    const payload = {
      fecha: parteFecha, servicio: 'Seguridad Parque Melilla', estado: parteEstado,
      turno_manana: datosTurnos.Mañana, turno_tarde: datosTurnos.Tarde, turno_noche: datosTurnos.Noche,
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('partes_seguridad').upsert([payload], { onConflict: 'fecha' }).select();
      if (error) throw error;
      if (data && data[0]) setParteId(data[0].id);
      alert(`✅ Borrador del turno de ${turno} guardado en la nube.`);
    } catch (err) { alert(`❌ Error al guardar: ${err.message}`); } finally { setIsSubmitting(false); }
  };

  const cerrarTurnoSeguridad = async (turno) => {
    const turnoDatos = datosTurnos[turno];
    if (!turnoDatos.vigilante_nombre.trim() || !turnoDatos.vigilante_tip.trim()) {
      return alert(`Debes rellenar Nombre y TIP antes de cerrar el turno de ${turno}.`);
    }

    const ahora = new Date();
    const hm = ahora.getHours() * 100 + ahora.getMinutes(); 
    let ventanaValida = false;
    let ventanaTexto = '';

    if (turno === 'Mañana') { ventanaValida = (hm >= 1345 && hm <= 1415); ventanaTexto = '13:45 y las 14:15'; } 
    else if (turno === 'Tarde') { ventanaValida = (hm >= 2145 && hm <= 2215); ventanaTexto = '21:45 y las 22:15'; } 
    else if (turno === 'Noche') { ventanaValida = (hm >= 545 && hm <= 615); ventanaTexto = '05:45 y las 06:15 de la madrugada'; }

    if (!ventanaValida) {
       return alert(`⚠️ Acción no permitida en este momento.\n\nSolo puedes cerrar el turno de ${turno} en la ventana de relevo (entre las ${ventanaTexto}).`);
    }

    const mensajeConfirmacion = turno === 'Noche'
      ? `¿Confirmas el cierre del Turno de Noche y el SELLADO DEFINITIVO del Parte Diario (${parteFecha})?`
      : `¿Confirmas el cierre definitivo del Turno de ${turno}?`;

    if (!window.confirm(mensajeConfirmacion)) return;

    setIsSubmitting(true);
    const nuevosDatosTurno = { ...datosTurnos };
    nuevosDatosTurno[turno].cerrado = true;

    const payload = {
      fecha: parteFecha, servicio: 'Seguridad Parque Melilla',
      estado: turno === 'Noche' ? 'Cerrado' : parteEstado,
      turno_manana: nuevosDatosTurno.Mañana, turno_tarde: nuevosDatosTurno.Tarde, turno_noche: nuevosDatosTurno.Noche,
      updated_at: new Date().toISOString()
    };

    if (turno === 'Noche') payload.cerrado_por = `${nuevosDatosTurno.Noche.vigilante_nombre} (TIP: ${nuevosDatosTurno.Noche.vigilante_tip})`;

    try {
      const { data, error } = await supabase.from('partes_seguridad').upsert([payload], { onConflict: 'fecha' }).select();
      if (error) throw error;
      if (data && data[0]) setParteId(data[0].id);

      setDatosTurnos(nuevosDatosTurno);
      if (turno === 'Noche') {
         setParteEstado('Cerrado');
         alert(`🔒 Parte Diario del ${parteFecha} CERRADO y ARCHIVADO con éxito.`);
         setShowParteSeguridad(false);
      } else { alert(`🔒 Turno de ${turno} cerrado correctamente.`); }
    } catch (err) {
      alert(`❌ Error al cerrar: ${err.message}`);
      nuevosDatosTurno[turno].cerrado = false;
      setDatosTurnos(nuevosDatosTurno);
    } finally { setIsSubmitting(false); }
  };

  // El almacenamiento se redirige al nuevo bucket seguro (incidencias-fotos)
  const subirFotoStorage = async (file, ticketId, prefijo) => {
    if (!file || !isOnline) return null;
    try {
      const fileName = `${prefijo}_${ticketId}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('incidencias-fotos').upload(fileName, file);
      if (error) return null;
      // Ya no devolvemos una public URL abierta, devolvemos solo la ruta/nombre para usar URLs firmadas
      return fileName;
    } catch (err) { return null; }
  };

  const handleScan = (resultado) => {
    if (!resultado) return;
    setIsScanning(false);
    if (resultado === 'CONTROL_HORARIO') {
      alert('El control horario ya no está activo.');
    } else {
      setZonaNombre(resultado);
      setShowForm(true);
    }
  };

  const abrirModalRegistroRonda = (zona = '') => {
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    setRondaFormZona(zona || (zonasPendientesHoy[0] || ZONAS_HABITUALES[0]));
    setRondaFormOperario('');
    setRondaFormHora(horaActual);
    setShowModalRonda(true);
  };

  const guardarRegistroRonda = async (e) => {
    e.preventDefault();
    if (!rondaFormZona.trim() || !rondaFormOperario.trim() || !rondaFormHora.trim()) {
      return alert('Indica la zona, el nombre del operario y la hora en que se realizó la ronda.');
    }

    setIsSubmitting(true);
    try {
      const [h, m] = rondaFormHora.split(':');
      const ahora = new Date();
      ahora.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      const nuevoRegistro = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        zona: rondaFormZona.trim(),
        operario: rondaFormOperario.trim(),
        departamento: 'Limpieza',
        estado: 'Conforme / OK',
        fecha: ahora.toISOString()
      };

      if (isOnline) {
        const { error } = await supabase.from('rondas_checklist').insert([nuevoRegistro]);
        if (error) throw error;
      }

      setChecklistHistorial(prev => [nuevoRegistro, ...prev]);
      setShowModalRonda(false);
      setRondaFormOperario('');
      alert(`✅ Ronda de "${rondaFormZona}" registrada: Operario ${rondaFormOperario.trim()} a las ${rondaFormHora}.`);
    } catch (err) {
      alert(`❌ Error al registrar ronda: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) { setFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmitCreacion = async (e) => {
    e.preventDefault();
    if (!zonaNombre || !departamentoDestino || (!fotoFile && departamentoDestino !== 'General')) return alert('Rellena los campos obligatorios (*)');
    setIsSubmitting(true);
    const idGenerado = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const codigoTicket = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const rutaSubida = await subirFotoStorage(fotoFile, idGenerado, 'previo');

    const nuevoTicket = {
      id: idGenerado, codigo_ticket: codigoTicket, titulo, descripcion: `Ubicación: ${zonaNombre}`, prioridad, estado: 'Registrada', departamento_destino: departamentoDestino, fecha_creacion: new Date().toISOString(), foto_url: rutaSubida, comentarios: []
    };

    if (isOnline) {
      const { data: ticketInsertado, error } = await supabase.from('incidencias').insert([{ ...nuevoTicket, comentarios: undefined }]).select();
      if (error) { alert(`❌ Error BD: ${error.message}`); setIsSubmitting(false); return; }
      setIncidenciasList(prev => [(ticketInsertado && ticketInsertado[0]) ? { ...ticketInsertado[0], comentarios: [] } : nuevoTicket, ...prev]);
      alert(`✅ Aviso enviado a ${departamentoDestino}.`);
    }
    setShowForm(false); setTitulo(''); setZonaNombre(''); setDepartamentoDestino(''); setFotoFile(null); setFotoPreview(null); setIsSubmitting(false);
  };

  const abrirFicha = async (inc) => {
    setIncidenciaSeleccionada(inc); setAccionActiva(null); setMotivoPendiente(''); setObservaciones(''); setFotoDespuesFile(null); setFotoDespuesPreview(null); setChatMessages([]);
    
    const totalComentarios = inc.comentarios ? inc.comentarios.length : 0;
    const nuevosLeidos = { ...mensajesLeidos, [inc.id]: totalComentarios };
    setMensajesLeidos(nuevosLeidos); localStorage.setItem('pm_mensajes_leidos', JSON.stringify(nuevosLeidos));
    
    if (isOnline) {
      const { data, error } = await supabase.from('comentarios').select('*').eq('incidencia_id', inc.id).order('fecha', { ascending: true });
      if (!error && data) {
        setChatMessages(data);
        if (data.length > totalComentarios) {
           const ajustesLeidos = { ...nuevosLeidos, [inc.id]: data.length };
           setMensajesLeidos(ajustesLeidos); localStorage.setItem('pm_mensajes_leidos', JSON.stringify(ajustesLeidos));
        }
      }
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    const texto = nuevoMensaje.trim();
    if (!texto || enviandoMensaje) return;
    setEnviandoMensaje(true);
    
    const msg = { id: Date.now().toString(), incidencia_id: incidenciaSeleccionada.id, autor: userProfile?.nombre_completo || userProfile?.email || 'Personal', mensaje: texto, fecha: new Date().toISOString() };
    setChatMessages(prev => [...prev, msg]); setNuevoMensaje('');

    setMensajesLeidos(prev => {
      const actualizados = { ...prev, [msg.incidencia_id]: (prev[msg.incidencia_id] || 0) + 1 };
      localStorage.setItem('pm_mensajes_leidos', JSON.stringify(actualizados));
      return actualizados;
    });

    if (isOnline) await supabase.from('comentarios').insert([{ id: msg.id, incidencia_id: msg.incidencia_id, autor: msg.autor, mensaje: msg.mensaje, fecha: msg.fecha }]);
    setEnviandoMensaje(false);
  };

  const ejecutarAccionTicket = async (tipoAccion, e) => {
    e.preventDefault();
    if (tipoAccion === 'Resuelta' && !fotoDespuesFile) return alert('Foto obligatoria.');
    if (tipoAccion === 'Pendiente' && !motivoPendiente.trim()) return alert('Justificación obligatoria.');
    setIsSubmitting(true);
    try {
      let rutaSubida = null;
      if (tipoAccion === 'Resuelta' && fotoDespuesFile) rutaSubida = await subirFotoStorage(fotoDespuesFile, incidenciaSeleccionada.id, 'resuelto');

      const nuevosDatos = tipoAccion === 'Resuelta' 
        ? { estado: 'Resuelta', observaciones_tecnico: observaciones, foto_resolucion_url: rutaSubida }
        : { estado: 'Pendiente', motivo_pendiente: motivoPendiente };
      
      const { data, error } = await supabase.from('incidencias').update(nuevosDatos).eq('id', incidenciaSeleccionada.id).select('*, comentarios(id)');
      if (error) throw error;

      setIncidenciasList(prev => prev.map(inc => (inc.id === incidenciaSeleccionada.id) ? data[0] : inc ));
      alert(tipoAccion === 'Resuelta' ? '✅ Aviso RESUELTO.' : 'Aviso PENDIENTE.');
      setIncidenciaSeleccionada(null); setAccionActiva(null);
    } catch (err) { alert('Error: ' + err.message); } finally { setIsSubmitting(false); }
  };

  const descargarCSV = (nombreArchivo, cabeceras, filas) => {
    const contenido = cabeceras + "\n" + filas.join("\n");
    const blob = new Blob(["\uFEFF" + contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };
  
  const exportarCSV = (tipo) => {
    if (tipo === 'incidencias') descargarCSV("Incidencias", "Codigo,Titulo,Descripcion,Prioridad,Estado,Motivo,Destino,Fecha", incidenciasList.map(i => `${i.codigo_ticket},"${i.titulo}","${i.descripcion}",${i.prioridad},${i.estado},"${i.motivo_pendiente || ''}",${i.departamento_destino},${new Date(i.fecha_creacion).toLocaleString()}`));
    if (tipo === 'fichajes') descargarCSV("Fichajes", "ID,Empleado,Tipo,Fecha", historialFichajes.map(f => `"${f.id}","${f.departamento}","${f.tipo_registro}","${new Date(f.fecha_hora).toLocaleString()}"`));
    if (tipo === 'checklist') descargarCSV("Checklist", "ID,Zona,Operario,Departamento,Estado,Fecha", checklistHistorial.map(r => `"${r.id}","${r.zona}","${r.operario}","${r.departamento}","${r.estado}","${new Date(r.fecha).toLocaleString()}"`));
    if (tipo === 'seguridad') {
      const filas = [];
      partesSeguridadList.forEach(p => {
        ['Mañana', 'Tarde', 'Noche'].forEach(t => {
          const turnoObj = p[`turno_${t.toLowerCase()}`];
          if (turnoObj && turnoObj.novedades) {
            turnoObj.novedades.forEach(nov => {
              filas.push(`"${p.fecha}","${p.servicio}","${p.estado}","${t}","${turnoObj.vigilante_nombre}","${turnoObj.vigilante_tip}","${nov.hora}","${nov.texto.replace(/"/g, '""')}"`);
            });
          }
        });
      });
      descargarCSV("Partes_Seguridad_Diarios", "Fecha,Servicio,Estado_Parte,Turno,Vigilante,TIP,Hora_Novedad,Descripcion", filas);
    }
  };

  if (loadingSession) return <div className="min-h-screen bg-pm-fondo flex items-center justify-center"><div className="w-8 h-8 border-4 border-pm-verde border-t-transparent rounded-full animate-spin"></div></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-pm-fondo flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="bg-pm-verde p-8 text-center flex flex-col items-center">
            <img src="/logo.png" alt="Parque Melilla" className="h-14 w-auto object-contain drop-shadow-sm mb-3" />
            <h1 className="text-xl font-bold text-white tracking-wider">PARQUE MELILLA</h1>
            <p className="text-xs text-pm-ocre font-semibold tracking-widest uppercase mt-0.5">Connect • Gestión Operativa</p>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border flex items-center gap-2"><ShieldAlert size={16} />{loginError}</div>}
            <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Correo electrónico</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border rounded-lg p-3 text-sm outline-none focus:border-pm-verde" /></div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Contraseña</label><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border rounded-lg p-3 text-sm outline-none focus:border-pm-verde" /></div>
            <button type="submit" disabled={isLoggingIn} className="w-full bg-pm-ocre hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-md flex justify-center items-center gap-2 transition-all">{isLoggingIn ? 'Accediendo...' : <><LogIn size={18} /> Iniciar Sesión</>}</button>

            {/* Accesos rápidos de prueba */}
            <div className="pt-2 border-t">
              <p className="text-[10px] font-bold text-gray-400 uppercase text-center mb-2">Selecciona un rol para probar (contraseña: 12345678)</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setLoginEmail('limpieza@test.com'); setLoginPassword('12345678'); }}
                  className="bg-pm-verde text-white text-[11px] font-bold py-2 px-1 rounded-lg hover:bg-green-700 transition text-center shadow-sm"
                >
                  🧹 Limpieza
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginEmail('gerencia@test.com'); setLoginPassword('12345678'); }}
                  className="bg-gray-800 text-white text-[11px] font-bold py-2 px-1 rounded-lg hover:bg-gray-900 transition text-center shadow-sm"
                >
                  🏢 Gerencia
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginEmail('seguridad@test.com'); setLoginPassword('12345678'); }}
                  className="bg-amber-600 text-white text-[11px] font-bold py-2 px-1 rounded-lg hover:bg-amber-700 transition text-center shadow-sm"
                >
                  🛡️ Seguridad
                </button>
              </div>
            </div>
          </form>

          {/* --- ACTUALIZACIÓN RGPD: Cláusula informativa Art.13 LOPD --- */}
          <div className="mx-6 mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left text-xs text-pm-texto">
            <div className="flex items-center gap-1.5 font-bold text-pm-verde mb-1.5">
              <span>ℹ️</span>
              <span>INFORMACIÓN DE PROTECCIÓN DE DATOS</span>
            </div>
            <ul className="space-y-1 text-[11px] leading-tight text-gray-600">
              <li><strong>Responsable:</strong> CDAD PROP PARQUE MELILLA.</li>
              <li><strong>Finalidad:</strong> Coordinación técnica operativa, registro de jornada y seguridad de las instalaciones.</li>
              <li><strong>Legitimación:</strong> Cumplimiento de obligaciones legales y ejecución contractual laboral/mercantil.</li>
              <li><strong>Destinatarios:</strong> Fuerzas y Cuerpos de Seguridad en supuestos legales; contratas autorizadas del centro.</li>
              <li><strong>Derechos:</strong> Acceso, rectificación, supresión y demás derechos en <em>gerencia@parquemelilla.es</em>.</li>
            </ul>
          </div>

        </div>
      </div>
    );
  }

  const isTabClosed = datosTurnos[pestañaTurnoVer]?.cerrado;
  const canEditTab = parteEstado !== 'Cerrado' && !isTabClosed;

  return (
    <div className="min-h-screen bg-pm-fondo text-pm-texto font-sans relative pb-20">
      
      {!isOnline && (
        <div className="bg-red-500 text-white text-[10px] font-bold py-1 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50"><WifiOff size={12} /> SIN COBERTURA</div>
      )}

      {/* VISTA OPERARIO */}
      {activeTab === 'operario' && (
        <>
          <header className="bg-pm-verde text-white p-4 shadow-md rounded-b-xl relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Parque Melilla" className="h-10 w-auto object-contain" />
                <h1 className="text-lg font-bold">CONNECT</h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white"><LogOut size={16} /></button>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs opacity-75">{userProfile?.nombre_completo || userProfile?.email}</p>
              <p className="text-lg font-bold text-pm-ocre">{miRol}</p>
            </div>
          </header>

          <main className="p-4 space-y-4 max-w-lg mx-auto">
            {esSeguridad && (
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-white font-bold flex items-center gap-2"><Shield className="text-pm-ocre" size={20}/> Cuadrante Operativo</h2>
                  <span className="text-[10px] bg-pm-ocre text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Turno {getTurnoYFechaOperativa().turnoDefault}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">Registro unificado de novedades del servicio de 24 horas.</p>
                <button onClick={abrirModalParte} className="w-full bg-pm-ocre hover:bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition">
                  <FileText size={18}/> Abrir Parte Diario de Hoy
                </button>
              </div>
            )}

            {(esLimpieza || esGerente) && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mt-2">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                      <CheckSquare size={16} className="text-pm-verde" /> Rondas Diarias de Limpieza
                    </h2>
                    <p className="text-[11px] text-gray-500">Supervisión diaria antes de finalizar la jornada.</p>
                  </div>
                  <button 
                    onClick={() => abrirModalRegistroRonda()} 
                    className="bg-pm-verde hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    <Plus size={13}/> Registrar
                  </button>
                </div>

                {zonasPendientesHoy.length > 0 ? (
                  <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-lg border border-amber-200 font-medium mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-pm-ocre shrink-0"/>
                    <span>⚠️ Pendientes hoy: <strong>{zonasPendientesHoy.join(', ')}</strong></span>
                  </div>
                ) : (
                  <div className="bg-green-50 text-green-800 text-xs px-3 py-2 rounded-lg border border-green-200 font-medium mb-3 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-green-600 shrink-0"/>
                    <span>Todas las rondas de hoy han sido verificadas.</span>
                  </div>
                )}

                <div className="space-y-2">
                  {ZONAS_HABITUALES.map(zona => {
                    const rondaHecha = rondasDeHoy.find(r => r.zona === zona);
                    if (rondaHecha) {
                      const horaHecha = new Date(rondaHecha.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={zona} className="flex justify-between items-center bg-green-50/60 p-2.5 rounded-lg border border-green-200 text-xs">
                          <div>
                            <span className="font-bold text-gray-800">{zona}</span>
                            <p className="text-[11px] text-gray-600 mt-0.5">Operario: <strong className="text-green-800">{rondaHecha.operario}</strong> • {horaHecha}</p>
                          </div>
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-300 flex items-center gap-1">
                            <Check size={11}/> Conforme
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={zona} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                        <div>
                          <span className="font-semibold text-gray-700">{zona}</span>
                          <p className="text-[10px] text-gray-400">Sin registrar hoy</p>
                        </div>
                        <button 
                          onClick={() => abrirModalRegistroRonda(zona)} 
                          className="bg-pm-ocre hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition"
                        >
                          Registrar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <h2 className="font-bold text-lg text-pm-verde flex items-center gap-2"><AlertTriangle size={18} className="text-pm-ocre" /> Tareas Asignadas</h2>
              <button onClick={() => { setZonaNombre(''); setDepartamentoDestino(''); setShowForm(true); }} className="text-xs font-bold text-pm-ocre underline">+ Dar Aviso</button>
            </div>
            
            {incidenciasList.filter(i => i.estado !== 'Resuelta' && (i.departamento_destino === miRol || i.departamento_destino === 'General' || !i.departamento_destino)).map((inc) => {
              const noLeidos = Math.max(0, (inc.comentarios?.length || 0) - (mensajesLeidos[inc.id] || 0));
              return (
              <div key={inc.id} onClick={() => abrirFicha(inc)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
                {inc.prioridad?.includes('P1') && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>}
                {inc.departamento_destino === 'General' && <div className="absolute top-0 right-0 bg-pm-ocre text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg shadow-sm flex items-center gap-1"><Bell size={10} /> GENERAL</div>}

                <div className="flex justify-between items-start mt-2">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inc.prioridad?.includes('P1') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{inc.prioridad}</span>
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${inc.estado === 'Resuelta' ? 'bg-green-100 text-green-700' : inc.estado === 'Pendiente' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{inc.estado}</span>
                    <h3 className="font-bold text-gray-800 text-sm mt-1.5">{inc.titulo}</h3>
                    <p className="text-xs text-gray-400">{inc.descripcion}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 mt-1">
                    {noLeidos > 0 && <span className="flex items-center gap-1 text-[10px] text-white font-bold bg-red-500 px-2 py-1 rounded-md shadow-sm animate-in zoom-in"><MessageSquare size={12} /> {noLeidos} nuevo{noLeidos > 1 ? 's' : ''}</span>}
                    <Search size={16} className="text-gray-300" />
                  </div>
                </div>
              </div>
            )})}
          </main>

          <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-10">
            <button onClick={() => setIsScanning(true)} className="w-full max-w-sm py-4 rounded-2xl shadow-lg font-bold text-lg flex items-center justify-center gap-2 bg-pm-ocre text-white"><Camera size={24} /> ESCANEAR QR AVISO</button>
          </div>
        </>
      )}

      {/* VISTA GERENCIA */}
      {activeTab === 'gerencia' && (
        <div className="bg-gray-50 min-h-screen">
          <header className="bg-pm-verde text-white p-4 lg:px-8 shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Parque Melilla" className="h-9 w-auto object-contain" />
                <div>
                  <h1 className="text-lg font-bold leading-tight">Parque Melilla Connect</h1>
                  <p className="text-[11px] text-pm-ocre font-semibold uppercase tracking-wider">Cuadro de Mando y Supervisión General</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-white/10 rounded-lg p-1 gap-1">
                  <button onClick={()=>exportarCSV('incidencias')} className="bg-pm-ocre text-white text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5"><Download size={13}/> Avisos</button>
                  <button onClick={()=>exportarCSV('fichajes')} className="bg-pm-ocre text-white text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5"><Download size={13}/> Fichajes</button>
                  <button onClick={()=>exportarCSV('checklist')} className="bg-pm-ocre text-white text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5"><Download size={13}/> Rondas</button>
                  <button onClick={()=>exportarCSV('seguridad')} className="bg-gray-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5"><Shield size={13}/> Partes 24h</button>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                  <button onClick={cargarDatos} className="bg-white/15 p-2 rounded-lg text-white"><RefreshCw size={14} /></button>
                  <button onClick={handleLogout} className="bg-white/15 p-2 rounded-lg text-white"><LogOut size={16} /></button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start"><span className="text-xs font-bold text-gray-500 uppercase">Alertas Críticas</span><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span></div><p className="text-3xl font-extrabold text-red-600 my-1">{incidenciasList.filter(i => i.prioridad?.includes('P1') && i.estado !== 'Resuelta').length}</p></div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between"><span className="text-xs font-bold text-gray-500 uppercase">Avisos Abiertos</span><p className="text-3xl font-extrabold text-amber-500 my-1">{incidenciasList.filter(i => i.estado !== 'Resuelta').length}</p></div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between"><span className="text-xs font-bold text-gray-500 uppercase">Avisos Resueltos</span><p className="text-3xl font-extrabold text-green-600 my-1">{incidenciasList.filter(i => i.estado === 'Resuelta').length}</p></div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-500 uppercase">Rondas Hoy</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${zonasPendientesHoy.length === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                    {zonasPendientesHoy.length === 0 ? 'Completadas' : `${zonasPendientesHoy.length} pendientes`}
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-pm-verde my-1">{rondasDeHoy.length} <span className="text-sm font-normal text-gray-400">/ {ZONAS_HABITUALES.length}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                {/* PANEL SUPERVISIÓN RONDAS DIARIAS */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={16} className="text-pm-verde" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase">Rondas Diarias Limpieza</h3>
                    </div>
                    <button 
                      onClick={() => abrirModalRegistroRonda()} 
                      className="bg-pm-verde hover:bg-green-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition"
                    >
                      <Plus size={12}/> Registrar
                    </button>
                  </div>

                  <div className="p-3 space-y-3">
                    {zonasPendientesHoy.length > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-xs flex items-center justify-between">
                        <span className="font-medium">⚠️ Quedan <strong>{zonasPendientesHoy.length}</strong> rondas pendientes hoy</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">Pendiente</span>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                        <CheckCircle size={14} className="text-green-600 shrink-0"/>
                        <span>Todas las rondas de hoy han sido verificadas.</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {ZONAS_HABITUALES.map(zona => {
                        const rondaHecha = rondasDeHoy.find(r => r.zona === zona);
                        if (rondaHecha) {
                          const horaStr = new Date(rondaHecha.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={zona} className="p-2.5 bg-green-50/50 rounded-lg border border-green-200 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-gray-800">{zona}</p>
                                <p className="text-[11px] text-gray-600 mt-0.5">Operario: <strong className="text-green-800">{rondaHecha.operario}</strong> • {horaStr}</p>
                              </div>
                              <span className="bg-green-100 text-green-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-green-300">
                                ✓ Conforme
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={zona} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-gray-700">{zona}</p>
                              <p className="text-[10px] text-gray-400">Pendiente registrar operario/hora</p>
                            </div>
                            <button 
                              onClick={() => abrirModalRegistroRonda(zona)} 
                              className="bg-pm-ocre hover:bg-amber-600 text-white font-bold text-[10px] px-2.5 py-1 rounded shadow-sm transition"
                            >
                              Incluir
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Histórico Control Horario anterior */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2"><Clock size={16} className="text-pm-ocre" /><h3 className="text-xs font-bold text-gray-700 uppercase">Control Horario (Histórico)</h3></div>
                  <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                    {historialFichajes.map((fich) => (
                      <div key={fich.id} className="flex justify-between items-center text-xs border-b pb-2"><p className="font-semibold text-gray-800">{fich.departamento} <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${fich.tipo_registro === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{fich.tipo_registro}</span></p><span className="text-gray-500 font-mono text-[11px]">{new Date(fich.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Monitor de Avisos</h2>
                  <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg flex-wrap">
                    {['Todas', 'Registrada', 'Pendiente', 'Resuelta'].map(est => (
                      <button key={est} onClick={() => setFiltroEstado(est)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${filtroEstado === est ? 'bg-pm-verde text-white' : 'text-gray-600'}`}>{est}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {incidenciasList.filter(i => filtroEstado === 'Todas' || i.estado === filtroEstado).map((inc) => {
                    const noLeidos = Math.max(0, (inc.comentarios?.length || 0) - (mensajesLeidos[inc.id] || 0));
                    return (
                    <div key={inc.id} onClick={() => abrirFicha(inc)} className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inc.prioridad?.includes('P1') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{inc.prioridad}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inc.estado === 'Resuelta' ? 'bg-green-100 text-green-700' : inc.estado === 'Pendiente' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{inc.estado}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-800 mb-1 group-hover:text-pm-verde">{inc.titulo}</h3>
                      <div className="mt-3 flex justify-between items-center text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-semibold">{inc.departamento_destino === 'General' ? <Bell size={12} className="text-pm-ocre" /> : <Users size={12} />} {inc.departamento_destino || 'Mantenimiento'}</span>
                        <div className="flex items-center gap-2">
                          {noLeidos > 0 && <span className="text-[10px] text-white font-bold bg-red-500 px-1.5 py-0.5 rounded-md"><MessageSquare size={10} className="inline"/> {noLeidos}</span>}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE INCIDENCIA */}
      {incidenciaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-3xl">
              <span className="text-xs font-bold text-gray-500">{incidenciaSeleccionada.codigo_ticket}</span>
              <button onClick={() => setIncidenciaSeleccionada(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              
              {/* --- ACTUALIZACIÓN RGPD: Componente de Imagen Seguro --- */}
              {incidenciaSeleccionada.foto_url && (
                <ImagenSegura ruta={incidenciaSeleccionada.foto_url} alt="Avería" className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              {/* -------------------------------------------------------- */}

              <h2 className="text-lg font-bold text-gray-800 leading-tight mb-1">{incidenciaSeleccionada.titulo}</h2>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1"><MapPin size={14} className="text-pm-ocre"/> {incidenciaSeleccionada.descripcion}</p>
              
              {incidenciaSeleccionada.estado === 'Pendiente' && (
                <div className="bg-purple-50 p-3 rounded-xl mb-4"><p className="text-xs font-bold text-purple-800">Motivo Pausa:</p><p className="text-sm italic">"{incidenciaSeleccionada.motivo_pendiente}"</p></div>
              )}
              {incidenciaSeleccionada.estado === 'Resuelta' && (
                <div className="bg-green-50 p-3 rounded-xl mb-4">
                  <p className="text-xs font-bold text-green-800">Resolución:</p><p className="text-sm italic mb-2">"{incidenciaSeleccionada.observaciones_tecnico}"</p>
                  
                  {/* --- ACTUALIZACIÓN RGPD: Componente de Imagen Seguro --- */}
                  {incidenciaSeleccionada.foto_resolucion_url && (
                    <ImagenSegura ruta={incidenciaSeleccionada.foto_resolucion_url} alt="Resolución" className="w-full h-40 object-cover rounded-lg" />
                  )}
                  {/* -------------------------------------------------------- */}
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 mb-3">Chat del Aviso</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                  {chatMessages.map(msg => {
                    const esMio = msg.autor === (userProfile?.nombre_completo || userProfile?.email);
                    return (
                      <div key={msg.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] text-gray-400 font-bold mx-1">{msg.autor}</span>
                        <div className={`p-2.5 rounded-2xl text-sm max-w-[85%] ${esMio ? 'bg-pm-verde text-white rounded-tr-none' : 'bg-white border rounded-tl-none'}`}>{msg.mensaje}</div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>
                <form onSubmit={enviarMensaje} className="flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} disabled={enviandoMensaje} className="flex-1 border rounded-full px-4 text-sm" placeholder="Escribe..." />
                  <button type="submit" disabled={!nuevoMensaje.trim()} className="bg-pm-ocre text-white p-2.5 rounded-full"><Send size={16}/></button>
                </form>
              </div>

              {incidenciaSeleccionada.estado !== 'Resuelta' && (
                <div className="mt-6 border-t pt-4">
                  {!accionActiva ? (
                    <div className="flex gap-2">
                      <button onClick={() => setAccionActiva('resolver')} className="w-1/2 bg-pm-verde text-white font-bold py-3 rounded-xl"><CheckCircle size={16} className="inline mr-1"/> RESOLVER</button>
                      {incidenciaSeleccionada.estado !== 'Pendiente' && <button onClick={() => setAccionActiva('pendiente')} className="w-1/2 bg-purple-600 text-white font-bold py-3 rounded-xl"><Clock size={16} className="inline mr-1"/> PENDIENTE</button>}
                    </div>
                  ) : accionActiva === 'resolver' ? (
                    <form onSubmit={(e) => ejecutarAccionTicket('Resuelta', e)} className="bg-gray-50 p-4 rounded-xl space-y-4">
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoCapture(e, setFotoDespuesFile, setFotoDespuesPreview)} className="w-full text-xs" required/>
                      <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Detalla el trabajo..." className="w-full border rounded-lg p-2 text-sm" required></textarea>
                      <div className="flex gap-2"><button type="button" onClick={() => setAccionActiva(null)} className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm">Atrás</button><button type="submit" className="w-2/3 bg-pm-verde text-white font-bold py-3 rounded-lg">Marcar Resuelto</button></div>
                    </form>
                  ) : (
                    <form onSubmit={(e) => ejecutarAccionTicket('Pendiente', e)} className="bg-purple-50 p-4 rounded-xl space-y-4">
                      <textarea value={motivoPendiente} onChange={e=>setMotivoPendiente(e.target.value)} placeholder="Motivo de la pausa..." className="w-full border rounded-lg p-2 text-sm" required></textarea>
                      <div className="flex gap-2"><button type="button" onClick={() => setAccionActiva(null)} className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm">Atrás</button><button type="submit" className="w-2/3 bg-purple-600 text-white font-bold py-3 rounded-lg">Pausar</button></div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARTE DIARIO DE SEGURIDAD */}
      {showParteSeguridad && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[95vh] h-full sm:h-auto">
            
            <div className="p-4 border-b flex justify-between items-center bg-gray-800 text-white rounded-t-3xl sm:rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="text-pm-ocre" size={18}/>
                  <span className="font-bold text-sm">Seguridad Parque Melilla</span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono mt-0.5">Fecha del servicio: {parteFecha}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${parteEstado === 'Cerrado' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                  {parteEstado.toUpperCase()}
                </span>
                <button onClick={() => setShowParteSeguridad(false)} className="text-gray-300 hover:text-white p-1"><X size={20}/></button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-gray-50 space-y-4">
              <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl">
                {['Mañana', 'Tarde', 'Noche'].map(t => {
                  const esElActual = turnoEnCurso === t;
                  const seleccionado = pestañaTurnoVer === t;
                  return (
                    <button key={t} onClick={() => setPestañaTurnoVer(t)} className={`py-2 text-xs font-bold rounded-lg transition-all relative ${seleccionado ? 'bg-gray-800 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}>
                      {t}
                      {esElActual && <span className="block text-[8px] font-normal text-pm-ocre uppercase tracking-wider">En Curso</span>}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700 uppercase">Vigilante Turno {pestañaTurnoVer}</span>
                  {pestañaTurnoVer !== turnoEnCurso && <span className="text-[10px] text-gray-400 italic">Lectura</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input type="text" value={datosTurnos[pestañaTurnoVer].vigilante_nombre} onChange={e => { const val = e.target.value; setDatosTurnos(prev => ({ ...prev, [pestañaTurnoVer]: { ...prev[pestañaTurnoVer], vigilante_nombre: val } })); }} disabled={!canEditTab} className="w-full border rounded-lg p-2 text-xs outline-none focus:border-gray-800 disabled:bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">TIP</label>
                    <input type="text" value={datosTurnos[pestañaTurnoVer].vigilante_tip} onChange={e => { const val = e.target.value; setDatosTurnos(prev => ({ ...prev, [pestañaTurnoVer]: { ...prev[pestañaTurnoVer], vigilante_tip: val } })); }} disabled={!canEditTab} className="w-full border rounded-lg p-2 text-xs outline-none focus:border-gray-800 disabled:bg-gray-50" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 flex items-center gap-1.5"><ClipboardList size={14} className="text-pm-ocre"/> Novedades {pestañaTurnoVer}</h3>
                
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {datosTurnos[pestañaTurnoVer].novedades.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Sin novedades registradas.</p>
                  ) : (
                    datosTurnos[pestañaTurnoVer].novedades.map((ent) => (
                      <div key={ent.id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex gap-2.5 relative pr-7 text-xs">
                        <span className="font-bold text-gray-700 bg-white px-1.5 py-0.5 rounded border shadow-sm h-fit shrink-0 font-mono">{ent.hora}</span>
                        <p className="text-gray-800 leading-snug flex-1">{ent.texto}</p>
                        {canEditTab && <button onClick={() => eliminarNovedadTurno(ent.id)} className="absolute right-2 top-2 text-red-400 hover:text-red-600"><X size={14}/></button>}
                      </div>
                    ))
                  )}
                </div>

                {canEditTab && (
                  <div className="border-t pt-3">
                    <div className="flex gap-2 mb-2">
                      <input type="time" value={nuevaEntradaHora} onChange={e => setNuevaEntradaHora(e.target.value)} className="border rounded-lg px-2 text-xs w-24 shrink-0 font-mono outline-none" />
                      <div className="relative flex-1">
                        <textarea value={nuevaEntradaTexto} onChange={e => setNuevaEntradaTexto(e.target.value)} placeholder="Dicta la novedad..." className="w-full border rounded-lg p-2 pr-9 text-xs min-h-[56px]"></textarea>
                        <button type="button" onClick={alternarDictado} className={`absolute right-1.5 bottom-2 p-1.5 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}><Mic size={15}/></button>
                      </div>
                    </div>
                    <button onClick={agregarNovedadTurno} className="w-full bg-gray-100 text-gray-800 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 border hover:bg-gray-200"><Plus size={14}/> Añadir Novedad</button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t space-y-2">
              {canEditTab && (
                <>
                  <button onClick={() => guardarAvanceParte(pestañaTurnoVer)} disabled={isSubmitting} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border shadow-sm"><Save size={16}/> {isSubmitting ? 'Guardando...' : `Guardar Borrador (${pestañaTurnoVer})`}</button>
                  <button onClick={() => cerrarTurnoSeguridad(pestañaTurnoVer)} disabled={isSubmitting} className={`w-full font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm ${pestañaTurnoVer === 'Noche' ? 'border border-red-300 bg-red-50 hover:bg-red-100 text-red-700' : 'bg-gray-800 hover:bg-gray-900 text-white'}`}>
                    <CandadoIcon size={16}/> {pestañaTurnoVer === 'Noche' ? 'Cerrar Turno Noche y Sellar Parte' : `Cerrar Definitivamente (${pestañaTurnoVer})`}
                  </button>
                </>
              )}
              {parteEstado !== 'Cerrado' && isTabClosed && <div className="bg-green-50 text-green-700 text-center py-2.5 rounded-xl text-xs font-bold border border-green-200"><CheckCircle size={14} className="inline mr-1"/> Turno de {pestañaTurnoVer} cerrado</div>}
              {parteEstado === 'Cerrado' && <div className="bg-gray-100 text-gray-500 text-center py-2.5 rounded-xl text-xs font-bold border"><CandadoIcon size={14} className="inline mr-1"/> Parte de 24 horas sellado</div>}
            </div>

          </div>
        </div>
      )}

      {/* MODAL CREAR AVISO (RESTO) */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-pm-verde">Reportar Aviso</h2><button onClick={() => setShowForm(false)} className="text-gray-400"><X size={24}/></button></div>
            <form onSubmit={handleSubmitCreacion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dirigido a *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Mantenimiento', 'Limpieza', 'Seguridad', 'General'].map((dep) => (
                    <button key={dep} type="button" onClick={() => setDepartamentoDestino(dep)} className={`py-2 text-xs font-bold rounded-lg border transition-all ${departamentoDestino === dep ? (dep === 'General' ? 'bg-pm-ocre text-white border-pm-ocre shadow-md' : 'bg-pm-verde text-white border-pm-verde shadow-md') : 'bg-white text-gray-700'}`}>{dep === 'General' ? '📣 General' : dep}</button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ubicación / Zona *</label>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-pm-ocre" />
                  <select value={zonaNombre} onChange={(e) => setZonaNombre(e.target.value)} required className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">
                    <option value="" disabled>Selecciona la zona...</option>
                    <option value="Aseos Galería P0">Aseos Galería P0</option>
                    <option value="Parking Subterráneo">Parking Subterráneo</option>
                    <option value="Cuarto Técnico">Cuarto Técnico</option>
                    <option value="Pasillo Principal">Pasillo Principal</option>
                    <option value="Plaza Central">Plaza Central</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Foto Previa {departamentoDestino === 'General' && <span className="normal-case font-normal">(Opcional)</span>}</label>
                <label className={`border-2 border-dashed ${departamentoDestino === 'General' ? 'border-gray-300 bg-gray-50' : 'border-pm-ocre bg-amber-50'} rounded-xl p-3 flex flex-col items-center cursor-pointer`}>
                  {fotoPreview ? <img src={fotoPreview} className="h-24 object-cover rounded" alt="prev"/> : <><Camera className="mb-1"/><span className="text-sm font-semibold">Tomar Foto</span></>}
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoCapture(e, setFotoFile, setFotoPreview)} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Título del Aviso *</label>
                <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Fuga de agua..." className="w-full border rounded-lg p-2.5 text-sm outline-none" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-pm-ocre text-white font-bold py-3.5 rounded-xl shadow-md">{isSubmitting ? 'Guardando...' : 'Enviar Aviso'}</button>
            </form>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-4 bg-pm-verde flex justify-between items-center"><h2 className="text-white font-bold">Escanear QR</h2><button onClick={() => setIsScanning(false)} className="bg-red-500 text-white p-1 rounded-full"><X size={20}/></button></div>
          <div className="flex-1 w-full flex items-center justify-center relative"><Scanner onScan={(r) => handleScan(r[0].rawValue)} formats={['qr_code']}/><div className="absolute border-2 border-pm-ocre w-64 h-64 rounded-xl opacity-60"></div></div>
        </div>
      )}


      {/* MODAL REGISTRO DE RONDA DIARIA (SUPERVISOR) */}
      {showModalRonda && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <CheckSquare size={16} className="text-pm-verde" /> Registro de Ronda Diaria
              </h3>
              <button onClick={() => setShowModalRonda(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>

            <form onSubmit={guardarRegistroRonda} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Zona / Área *</label>
                <select 
                  value={rondaFormZona} 
                  onChange={e => setRondaFormZona(e.target.value)} 
                  className="w-full border rounded-lg p-2.5 text-xs font-semibold bg-white outline-none focus:border-pm-verde"
                  required
                >
                  {ZONAS_HABITUALES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                  <option value="Cuarto Técnico">Cuarto Técnico</option>
                  <option value="Plaza Central">Plaza Central</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Operario que realizó la ronda *</label>
                <input 
                  type="text" 
                  value={rondaFormOperario} 
                  onChange={e => setRondaFormOperario(e.target.value)} 
                  placeholder="Ej: María Gómez, Juan Pérez..." 
                  className="w-full border rounded-lg p-2.5 text-xs outline-none focus:border-pm-verde" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Hora de realización *</label>
                <input 
                  type="time" 
                  value={rondaFormHora} 
                  onChange={e => setRondaFormHora(e.target.value)} 
                  className="w-full border rounded-lg p-2.5 text-xs font-mono outline-none focus:border-pm-verde" 
                  required 
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowModalRonda(false)} 
                  className="w-1/3 py-2.5 rounded-xl border text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-2/3 py-2.5 rounded-xl bg-pm-verde hover:bg-green-700 text-white text-xs font-bold shadow-md transition"
                >
                  {isSubmitting ? 'Guardando...' : 'Confirmar Ronda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {esGerente && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around pb-safe z-40 h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
          <button onClick={() => setActiveTab('operario')} className={`flex flex-col items-center justify-center w-full ${activeTab === 'operario' ? 'text-pm-ocre' : 'text-gray-400'}`}><ClipboardList size={24}/><span className="text-[10px] font-bold">Operativa</span></button>
          <button onClick={() => setActiveTab('gerencia')} className={`flex flex-col items-center justify-center w-full ${activeTab === 'gerencia' ? 'text-pm-ocre' : 'text-gray-400'}`}><LayoutDashboard size={24}/><span className="text-[10px] font-bold">Supervisión</span></button>
        </nav>
      )}
    </div>
  );
}

export default App;