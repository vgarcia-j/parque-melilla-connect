import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  MapPin,
  Check,
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Users,
  LogIn,
  LogOut,
  FileText,
  ShieldAlert,
  Download,
  Send,
  WifiOff,
  Search,
  CheckSquare,
  Bell,
  RefreshCw,
  Shield,
  Mic,
  Plus,
  Save,
  Printer,
  PenTool,
  FileWarning,
  Upload,
} from "lucide-react";
import * as QrModule from "@yudiel/react-qr-scanner";
import { supabase } from "./supabaseClient";
import "./styles.css";

const Scanner = QrModule.Scanner || QrModule.default || QrModule;

const CandadoIcon = ({ size = 14, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// =========================================================================
// COMPONENTE: PANEL DE FIRMA DIGITAL TÁCTIL
// =========================================================================
const PanelFirma = ({
  onGuardar,
  onCancelar,
  titulo,
  subtitulo = "Cierre de Turno",
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#204136";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col items-center">
        <h3 className="font-bold text-[#204136] mb-1">Firma Digital Oficial</h3>
        <p className="text-xs text-gray-500 mb-4 text-center">
          {subtitulo}: {titulo}
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 w-full flex justify-center mb-4 relative">
          <span className="absolute top-2 left-2 text-[10px] text-gray-300 font-bold uppercase tracking-widest pointer-events-none">
            Espacio para Firma
          </span>
          <canvas
            ref={canvasRef}
            width={300}
            height={180}
            className="cursor-crosshair w-full"
            style={{ touchAction: "none" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex w-full gap-2 mb-4">
          <button
            type="button"
            onClick={clearCanvas}
            className="w-full text-xs text-gray-500 bg-gray-100 font-bold py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Borrar y Repetir
          </button>
        </div>

        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-300 transition"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={() => onGuardar(canvasRef.current.toDataURL("image/png"))}
            className="w-2/3 bg-pm-verde hover:bg-green-800 text-white font-bold py-3 rounded-xl text-sm shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <PenTool size={16} /> Sellar Documento
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// COMPONENTE PRINCIPAL: APP
// =========================================================================
export function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState("operario");

  // ESTADOS GLOBALES DE DATOS
  const [incidenciasList, setIncidenciasList] = useState([]);
  const [historialFichajes, setHistorialFichajes] = useState([]);
  const [checklistHistorial, setChecklistHistorial] = useState([]);
  const [partesSeguridadList, setPartesSeguridadList] = useState([]);
  const [informesIntervencionList, setInformesIntervencionList] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");

  // ESTADOS DE CREACIÓN Y CÁMARA
  const [isScanning, setIsScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [zonaNombre, setZonaNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [prioridad, setPrioridad] = useState("P3-Media");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [departamentoDestino, setDepartamentoDestino] = useState("");

  // REFERENCIAS PARA DISPARAR CÁMARA / GALERÍA
  const camaraAvisoRef = useRef(null);
  const galeriaAvisoRef = useRef(null);
  const camaraResueltoRef = useRef(null);
  const galeriaResueltoRef = useRef(null);

  // ESTADOS DE DETALLE DE INCIDENCIA
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
  const [accionActiva, setAccionActiva] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const chatBottomRef = useRef(null);
  const [mensajesLeidos, setMensajesLeidos] = useState({});

  const [fotoDespuesFile, setFotoDespuesFile] = useState(null);
  const [fotoDespuesPreview, setFotoDespuesPreview] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [motivoPendiente, setMotivoPendiente] = useState("");

  const [showFichajeModal, setShowFichajeModal] = useState(false);
  const [estadoFichaje, setEstadoFichaje] = useState(null);
  const [rondasPendientes, setRondasPendientes] = useState([]);

  // ================= ESTADOS DEL PARTE DIARIO (24H) =================
  const [showParteSeguridad, setShowParteSeguridad] = useState(false);
  const [parteAImprimir, setParteAImprimir] = useState(null);
  const [turnoAFirmar, setTurnoAFirmar] = useState(null);

  const [parteId, setParteId] = useState(null);
  const [parteFecha, setParteFecha] = useState("");
  const [parteEstado, setParteEstado] = useState("Abierto");
  const [pestañaTurnoVer, setPestañaTurnoVer] = useState("Mañana");
  const [turnoEnCurso, setTurnoEnCurso] = useState("Mañana");

  const [datosTurnos, setDatosTurnos] = useState({
    Mañana: {
      vigilante_nombre: "",
      vigilante_tip: "",
      novedades: [],
      firma: null,
      cerrado: false,
    },
    Tarde: {
      vigilante_nombre: "",
      vigilante_tip: "",
      novedades: [],
      firma: null,
      cerrado: false,
    },
    Noche: {
      vigilante_nombre: "",
      vigilante_tip: "",
      novedades: [],
      firma: null,
      cerrado: false,
    },
  });

  const [inventario, setInventario] = useState({
    walkies: 2,
    linternas: 2,
    moviles: 1,
    llaves_maestras: true,
    observaciones_material: "",
  });

  const [nuevaEntradaHora, setNuevaEntradaHora] = useState("");
  const [nuevaEntradaTexto, setNuevaEntradaTexto] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // ================= ESTADOS DEL INFORME EXTRAORDINARIO =================
  const [showInformeExtr, setShowInformeExtr] = useState(false);
  const [informeAImprimir, setInformeAImprimir] = useState(null);
  const [datosInforme, setDatosInforme] = useState({
    ubicacion_exacta: "",
    tipologia: "Hurto / Robo",
    cuerpo_seguridad: "Cuerpo Nacional de Policía (CNP)",
    dotacion_policial: "",
    numero_agentes: "",
    numero_atestado: "",
    descripcion_detallada: "",
    personas_implicadas: "",
    camaras_cctv: "",
    efectos_danos: "",
    vigilante_tip: "",
  });
  const [informeHora, setInformeHora] = useState("");
  const [informeAFirmar, setInformeAFirmar] = useState(false);
  const recognitionInformeRef = useRef(null);
  const [isListeningInforme, setIsListeningInforme] = useState(false);

  // ================= LÓGICA DE TURNOS =================
  const getTurnoYFechaOperativa = (datosActuales = null) => {
    const ahora = new Date();
    const hm = ahora.getHours() * 100 + ahora.getMinutes();
    let turno = "Mañana";
    let fechaObj = new Date(ahora);

    if (hm >= 600 && hm < 1400) turno = "Mañana";
    else if (hm >= 1400 && hm < 2200) turno = "Tarde";
    else {
      turno = "Noche";
      if (hm < 600) fechaObj.setDate(fechaObj.getDate() - 1);
    }

    if (datosActuales) {
      if (turno === "Mañana" && datosActuales.Mañana?.cerrado) turno = "Tarde";
      else if (turno === "Tarde" && datosActuales.Tarde?.cerrado)
        turno = "Noche";
    }

    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const day = String(fechaObj.getDate()).padStart(2, "0");
    return { turnoDefault: turno, fechaISO: `${year}-${month}-${day}` };
  };

  const puedeEditarTurno = (t) => {
    if (parteEstado === "Cerrado") return false;
    if (datosTurnos[t]?.cerrado) return false;
    const hm = new Date().getHours() * 100 + new Date().getMinutes();

    if (t === "Mañana")
      return hm >= 600 && hm <= 1415 && !datosTurnos.Mañana?.cerrado;
    if (t === "Tarde") {
      const relevoAnticipado = hm >= 1345 && datosTurnos.Mañana?.cerrado;
      return (
        ((hm >= 1400 && hm <= 2215) || relevoAnticipado) &&
        !datosTurnos.Tarde?.cerrado
      );
    }
    if (t === "Noche") {
      const relevoAnticipado = hm >= 2145 && datosTurnos.Tarde?.cerrado;
      return (
        (hm >= 2200 || hm <= 615 || relevoAnticipado) &&
        !datosTurnos.Noche?.cerrado
      );
    }
    return false;
  };

  // ================= EFECTOS GLOBALES =================
  useEffect(() => {
    const mem = localStorage.getItem("pm_mensajes_leidos");
    if (mem) setMensajesLeidos(JSON.parse(mem));
  }, []);

  useEffect(() => {
    if (incidenciaSeleccionada && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, incidenciaSeleccionada]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const cargarPerfil = async (user) => {
    try {
      const { data, error } = await supabase
        .from("perfiles_usuarios")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setUserProfile(data);
        setActiveTab(data.rol === "Gerencia" ? "gerencia" : "operario");
      }
    } catch (err) {}
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) cargarPerfil(session.user);
      setLoadingSession(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) cargarPerfil(session.user);
      else {
        setUserProfile(null);
        setEstadoFichaje(null);
      }
      setLoadingSession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) setLoginError("Credenciales incorrectas.");
    setIsLoggingIn(false);
  };

  // CIERRE DE SESIÓN FORZADO (Evita cuelgues)
  const handleLogout = async () => {
    try {
      // 1. Borramos el token de caché local de Supabase de raíz
      for (let key in localStorage) {
        if (key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      }
      // 2. Pedimos al servidor que cierre sesión
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      // 3. Reseteamos los estados de React
      setSession(null);
      setUserProfile(null);
      setEstadoFichaje(null);
      setActiveTab("operario");
      setLoginEmail("");
      setLoginPassword("");
      // 4. Forzamos una recarga limpia del navegador
      window.location.reload();
    }
  };

  const cargarDatos = async () => {
    if (!session || !isOnline) return;
    try {
      const { data: incidencias } = await supabase
        .from("incidencias")
        .select("*, comentarios(id)")
        .order("fecha_creacion", { ascending: false })
        .limit(100);
      if (incidencias) setIncidenciasList(incidencias);

      const { data: fichajes } = await supabase
        .from("fichajes")
        .select("*")
        .order("fecha_hora", { ascending: false })
        .limit(20);
      if (fichajes) setHistorialFichajes(fichajes);

      const { data: rondas } = await supabase
        .from("rondas_checklist")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(20);
      if (rondas) setChecklistHistorial(rondas);

      const miRolActual = userProfile?.rol || "Mantenimiento";
      if (miRolActual === "Gerencia" || miRolActual === "Seguridad") {
        const { data: partes } = await supabase
          .from("partes_seguridad")
          .select("*")
          .order("fecha", { ascending: false })
          .limit(50);
        if (partes) setPartesSeguridadList(partes);

        const { data: informes } = await supabase
          .from("informes_intervencion")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (informes) setInformesIntervencionList(informes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(() => cargarDatos(), 6000);
    const canalRealtime = supabase
      .channel("cambios-bd-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidencias" },
        () => cargarDatos()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comentarios" },
        () => cargarDatos()
      )
      .subscribe();
    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(canalRealtime);
    };
  }, [session, isOnline, userProfile]);

  const miRol = userProfile?.rol || "Mantenimiento";
  const esLimpieza = miRol === "Limpieza";
  const esSeguridad = miRol === "Seguridad";
  const esGerente = miRol === "Gerencia";

  // ================= FUNCIONES DEL PARTE DE SEGURIDAD 24H =================
  const abrirModalParte = async () => {
    const { fechaISO } = getTurnoYFechaOperativa();
    setParteFecha(fechaISO);
    const ahora = new Date();
    setNuevaEntradaHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    );

    try {
      const { data, error } = await supabase
        .from("partes_seguridad")
        .select("*")
        .eq("fecha", fechaISO)
        .maybeSingle();
      let turnosCargados = {
        Mañana: {
          vigilante_nombre: "",
          vigilante_tip: "",
          novedades: [],
          firma: null,
          cerrado: false,
        },
        Tarde: {
          vigilante_nombre: "",
          vigilante_tip: "",
          novedades: [],
          firma: null,
          cerrado: false,
        },
        Noche: {
          vigilante_nombre: "",
          vigilante_tip: "",
          novedades: [],
          firma: null,
          cerrado: false,
        },
      };

      if (!error && data) {
        setParteId(data.id);
        setParteEstado(data.estado || "Abierto");
        turnosCargados = {
          Mañana: data.turno_manana || turnosCargados.Mañana,
          Tarde: data.turno_tarde || turnosCargados.Tarde,
          Noche: data.turno_noche || turnosCargados.Noche,
        };
        setDatosTurnos(turnosCargados);
        setInventario(
          data.inventario || {
            walkies: 2,
            linternas: 2,
            moviles: 1,
            llaves_maestras: true,
            observaciones_material: "",
          }
        );
      } else {
        setParteId(null);
        setParteEstado("Abierto");
        setDatosTurnos(turnosCargados);
        setInventario({
          walkies: 2,
          linternas: 2,
          moviles: 1,
          llaves_maestras: true,
          observaciones_material: "",
        });
      }

      const { turnoDefault } = getTurnoYFechaOperativa(turnosCargados);
      setTurnoEnCurso(turnoDefault);
      setPestañaTurnoVer(turnoDefault);
      if (
        !turnosCargados[turnoDefault]?.vigilante_nombre &&
        userProfile?.nombre_completo
      ) {
        setDatosTurnos((prev) => ({
          ...prev,
          [turnoDefault]: {
            ...prev[turnoDefault],
            vigilante_nombre: userProfile.nombre_completo,
          },
        }));
      }
    } catch (err) {}
    setShowParteSeguridad(true);
  };

  const agregarNovedadTurno = () => {
    if (!nuevaEntradaHora || !nuevaEntradaTexto.trim())
      return alert("Indica la hora y novedad.");
    setDatosTurnos((prev) => ({
      ...prev,
      [pestañaTurnoVer]: {
        ...prev[pestañaTurnoVer],
        novedades: [
          ...prev[pestañaTurnoVer].novedades,
          {
            id: Date.now(),
            hora: nuevaEntradaHora,
            texto: nuevaEntradaTexto.trim(),
          },
        ],
      },
    }));
    setNuevaEntradaTexto("");
    const ahora = new Date();
    setNuevaEntradaHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    );
  };

  const eliminarNovedadTurno = (id) => {
    setDatosTurnos((prev) => ({
      ...prev,
      [pestañaTurnoVer]: {
        ...prev[pestañaTurnoVer],
        novedades: prev[pestañaTurnoVer].novedades.filter((n) => n.id !== id),
      },
    }));
  };

  const alternarDictado = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return alert("Tu navegador no soporta dictado directo.");
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setNuevaEntradaTexto((prev) =>
        prev
          ? prev + " " + event.results[0][0].transcript
          : event.results[0][0].transcript
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const guardarAvanceParte = async (turno) => {
    const turnoDatos = datosTurnos[turno];
    if (
      !turnoDatos.vigilante_nombre.trim() ||
      !turnoDatos.vigilante_tip.trim()
    ) {
      return alert(
        `Indica tu Nombre y nº de TIP en el turno de ${turno} antes de guardar.`
      );
    }
    setIsSubmitting(true);
    const payload = {
      fecha: parteFecha,
      servicio: "CDAD PROP PARQUE MELILLA",
      estado: parteEstado,
      turno_manana: datosTurnos.Mañana,
      turno_tarde: datosTurnos.Tarde,
      turno_noche: datosTurnos.Noche,
      inventario: inventario,
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase
        .from("partes_seguridad")
        .upsert([payload], { onConflict: "fecha" })
        .select();
      if (error) throw error;
      if (data && data[0]) setParteId(data[0].id);
      alert(`✅ Borrador del turno de ${turno} guardado en la nube.`);
    } catch (err) {
      alert(`❌ Error al guardar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const iniciarCierreTurno = (turno) => {
    const turnoDatos = datosTurnos[turno];
    if (
      !turnoDatos.vigilante_nombre.trim() ||
      !turnoDatos.vigilante_tip.trim()
    ) {
      return alert(`Debes rellenar Nombre y TIP antes de cerrar.`);
    }

    const hm = new Date().getHours() * 100 + new Date().getMinutes();
    let ventanaValida = false;
    if (turno === "Mañana") {
      ventanaValida = hm >= 1345 && hm <= 1415;
    } else if (turno === "Tarde") {
      ventanaValida = hm >= 2145 && hm <= 2215;
    } else if (turno === "Noche") {
      ventanaValida = hm >= 545 && hm <= 615;
    }

    if (!ventanaValida) {
      alert(
        `⚠️ AVISO: Estás cerrando el turno fuera del horario habitual de relevo (+/- 15 min). Permitiendo por encontrarse en modo de pruebas.`
      );
    }
    setTurnoAFirmar(turno);
  };

  const confirmarCierreConFirma = async (firmaUrl) => {
    setIsSubmitting(true);
    const turno = turnoAFirmar;
    const nuevosDatosTurno = { ...datosTurnos };

    nuevosDatosTurno[turno].cerrado = true;
    nuevosDatosTurno[turno].firma = firmaUrl;

    const payload = {
      fecha: parteFecha,
      servicio: "CDAD PROP PARQUE MELILLA",
      estado: turno === "Noche" ? "Cerrado" : parteEstado,
      turno_manana: nuevosDatosTurno.Mañana,
      turno_tarde: nuevosDatosTurno.Tarde,
      turno_noche: nuevosDatosTurno.Noche,
      inventario: inventario,
      updated_at: new Date().toISOString(),
    };
    if (turno === "Noche")
      payload.cerrado_por = `${nuevosDatosTurno.Noche.vigilante_nombre} (TIP: ${nuevosDatosTurno.Noche.vigilante_tip})`;

    try {
      const { data, error } = await supabase
        .from("partes_seguridad")
        .upsert([payload], { onConflict: "fecha" })
        .select();
      if (error) throw error;
      setDatosTurnos(nuevosDatosTurno);
      setTurnoAFirmar(null);

      if (turno === "Noche") {
        setParteEstado("Cerrado");
        alert(`🔒 Parte Diario CERRADO y SELLADO.`);
        setShowParteSeguridad(false);
      } else {
        const siguienteTurno = turno === "Mañana" ? "Tarde" : "Noche";
        alert(
          `🔒 Turno de ${turno} firmado y cerrado correctamente.\n\nSe activa automáticamente el turno de ${siguienteTurno}.`
        );
        setTurnoEnCurso(siguienteTurno);
        setPestañaTurnoVer(siguienteTurno);
      }
      cargarDatos();
    } catch (err) {
      alert(`❌ Error al cerrar: ${err.message}`);
      nuevosDatosTurno[turno].cerrado = false;
      nuevosDatosTurno[turno].firma = null;
      setDatosTurnos(nuevosDatosTurno);
      setTurnoAFirmar(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= FUNCIONES DEL INFORME EXTRAORDINARIO =================
  const abrirModalInformeExtr = () => {
    const ahora = new Date();
    setInformeHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    );
    setDatosInforme({
      ubicacion_exacta: "",
      tipologia: "Hurto / Robo",
      cuerpo_seguridad: "Cuerpo Nacional de Policía (CNP)",
      dotacion_policial: "",
      numero_agentes: "",
      numero_atestado: "",
      descripcion_detallada: "",
      personas_implicadas: "",
      camaras_cctv: "",
      efectos_danos: "",
      vigilante_tip: "",
    });
    setShowInformeExtr(true);
  };

  const alternarDictadoInforme = () => {
    if (isListeningInforme && recognitionInformeRef.current) {
      recognitionInformeRef.current.stop();
      setIsListeningInforme(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return alert("Tu navegador no soporta dictado directo.");
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.onstart = () => setIsListeningInforme(true);
    recognition.onresult = (event) => {
      setDatosInforme((prev) => ({
        ...prev,
        descripcion_detallada: prev.descripcion_detallada
          ? prev.descripcion_detallada + " " + event.results[0][0].transcript
          : event.results[0][0].transcript,
      }));
    };
    recognition.onerror = () => setIsListeningInforme(false);
    recognition.onend = () => setIsListeningInforme(false);
    recognition.start();
    recognitionInformeRef.current = recognition;
  };

  const iniciarFirmaInforme = () => {
    if (
      !datosInforme.ubicacion_exacta ||
      !datosInforme.descripcion_detallada ||
      !datosInforme.vigilante_tip
    ) {
      return alert("Rellena al menos los campos obligatorios (*).");
    }
    setInformeAFirmar(true);
  };

  const confirmarInformeConFirma = async (firmaUrl) => {
    setIsSubmitting(true);
    const codExpediente = `INT-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const payload = {
      codigo_expediente: codExpediente,
      hora: informeHora,
      ubicacion_exacta: datosInforme.ubicacion_exacta,
      tipologia: datosInforme.tipologia,
      cuerpo_seguridad: datosInforme.cuerpo_seguridad,
      dotacion_policial: datosInforme.dotacion_policial,
      numero_agentes: datosInforme.numero_agentes,
      numero_atestado: datosInforme.numero_atestado,
      descripcion_detallada: datosInforme.descripcion_detallada,
      personas_implicadas: datosInforme.personas_implicadas,
      camaras_cctv: datosInforme.camaras_cctv,
      efectos_danos: datosInforme.efectos_danos,
      vigilante_nombre:
        userProfile?.nombre_completo || "Vigilante de Seguridad",
      vigilante_tip: datosInforme.vigilante_tip,
      firma_digital: firmaUrl,
    };

    try {
      const { error } = await supabase
        .from("informes_intervencion")
        .insert([payload]);
      if (error) throw error;

      const { turnoDefault, fechaISO } = getTurnoYFechaOperativa();
      const notaAuto = `🔴 Intervención de seguridad / ${datosInforme.tipologia} en ${datosInforme.ubicacion_exacta}. Se instruye y sella el Informe Extraordinario Ref. ${codExpediente}.`;

      const { data: pdData } = await supabase
        .from("partes_seguridad")
        .select("*")
        .eq("fecha", fechaISO)
        .maybeSingle();
      if (pdData && pdData.estado !== "Cerrado") {
        const pdTurnoClave = `turno_${turnoDefault
          .toLowerCase()
          .replace("ñ", "n")}`;
        const turnoObj = pdData[pdTurnoClave] || {
          vigilante_nombre: userProfile?.nombre_completo,
          vigilante_tip: datosInforme.vigilante_tip,
          novedades: [],
          cerrado: false,
        };
        turnoObj.novedades.push({
          id: Date.now(),
          hora: informeHora,
          texto: notaAuto,
        });
        await supabase
          .from("partes_seguridad")
          .update({ [pdTurnoClave]: turnoObj })
          .eq("id", pdData.id);
      }

      alert(
        `✅ INFORME EXTRAORDINARIO SELLADO CON ÉXITO.\nReferencia Oficial: ${codExpediente}`
      );
      setInformeAFirmar(false);
      setShowInformeExtr(false);
      cargarDatos();
    } catch (err) {
      alert(`❌ Error al guardar el informe: ${err.message}`);
      setInformeAFirmar(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= FUNCIONES DE INCIDENCIAS =================
  const subirFotoStorage = async (file, ticketId, prefijo) => {
    if (!file || !isOnline) return null;
    try {
      const fileName = `${prefijo}_${ticketId}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("fotos")
        .upload(fileName, file);
      if (error) return null;
      const { data: linkData } = supabase.storage
        .from("fotos")
        .getPublicUrl(fileName);
      return linkData.publicUrl;
    } catch (err) {
      return null;
    }
  };

  const handleScan = (resultado) => {
    if (!resultado) return;
    setIsScanning(false);
    if (resultado === "CONTROL_HORARIO") {
      if (esLimpieza) setShowFichajeModal(true);
      else alert("Restringido a Limpieza.");
    } else {
      if (esLimpieza && !estadoFichaje)
        return alert("Inicia turno antes de registrar.");
      setZonaNombre(resultado);
      setShowForm(true);
    }
  };

  const registrarFichaje = async (tipo) => {
    setIsSubmitting(true);
    const ahora = new Date();
    const registro = {
      id: Date.now().toString(),
      departamento: `Limpieza - ${
        userProfile?.nombre_completo || userProfile?.email
      }`,
      tipo_registro: tipo,
      fecha_hora: ahora.toISOString(),
    };
    if (tipo === "ENTRADA") {
      setEstadoFichaje(ahora);
      setRondasPendientes([
        "Aseos Galería P0",
        "Pasillo Principal",
        "Parking Subterráneo",
      ]);
      alert("Entrada registrada.");
    } else {
      setEstadoFichaje(null);
      setRondasPendientes([]);
      alert("Salida registrada.");
    }
    if (isOnline)
      try {
        await supabase
          .from("fichajes")
          .insert([
            { departamento: registro.departamento, tipo_registro: tipo },
          ]);
      } catch (err) {}
    setHistorialFichajes((prev) => [registro, ...prev]);
    setShowFichajeModal(false);
    setIsSubmitting(false);
  };

  const completarRonda = async (zona) => {
    const registroRonda = {
      id: Date.now().toString(),
      zona,
      operario: userProfile?.nombre_completo || "Operario",
      departamento: miRol,
      estado: "Conforme / OK",
      fecha: new Date().toISOString(),
    };
    setRondasPendientes((prev) => prev.filter((r) => r !== zona));
    if (isOnline)
      try {
        await supabase.from("rondas_checklist").insert([registroRonda]);
      } catch (err) {}
    setChecklistHistorial((prev) => [registroRonda, ...prev]);
    alert(`✅ Revisión de ${zona} registrada.`);
  };

  const handlePhotoCapture = (e, setFile, setPreview) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleSubmitCreacion = async (e) => {
    e.preventDefault();
    if (
      !zonaNombre ||
      !departamentoDestino ||
      (!fotoFile && departamentoDestino !== "General")
    ) {
      return alert("Rellena los campos obligatorios (*).");
    }
    setIsSubmitting(true);

    const idGenerado =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString();
    const codigoTicket = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaActual = new Date().toISOString();
    const urlSubida = await subirFotoStorage(fotoFile, idGenerado, "previo");

    const registroBD = {
      id: idGenerado,
      codigo_ticket: codigoTicket,
      titulo: titulo,
      descripcion: `Ubicación: ${zonaNombre}`,
      prioridad: prioridad,
      estado: "Registrada",
      departamento_destino: departamentoDestino,
      fecha_creacion: fechaActual,
      foto_url: urlSubida,
    };

    const nuevoTicketLocal = {
      ...registroBD,
      comentarios: [],
    };

    if (isOnline) {
      const { data: ticketInsertado, error } = await supabase
        .from("incidencias")
        .insert([registroBD])
        .select();

      if (error) {
        alert(`❌ Error BD: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      const creado =
        ticketInsertado && ticketInsertado[0]
          ? { ...ticketInsertado[0], comentarios: [] }
          : nuevoTicketLocal;

      setIncidenciasList((prev) => [creado, ...prev]);
      alert(`✅ Aviso enviado a ${departamentoDestino}.`);
    } else {
      setIncidenciasList((prev) => [nuevoTicketLocal, ...prev]);
      alert("⚠️ Sin cobertura. Guardado localmente.");
    }

    setShowForm(false);
    setTitulo("");
    setZonaNombre("");
    setDepartamentoDestino("");
    setFotoFile(null);
    setFotoPreview(null);
    setIsSubmitting(false);
  };

  const abrirFicha = async (inc) => {
    if (esLimpieza && !estadoFichaje)
      return alert("Debes iniciar turno para ver los detalles.");
    setIncidenciaSeleccionada(inc);
    setAccionActiva(null);
    setMotivoPendiente("");
    setObservaciones("");
    setFotoDespuesFile(null);
    setFotoDespuesPreview(null);
    setChatMessages([]);

    const totalComentarios = inc.comentarios ? inc.comentarios.length : 0;
    const nuevosLeidos = { ...mensajesLeidos, [inc.id]: totalComentarios };
    setMensajesLeidos(nuevosLeidos);
    localStorage.setItem("pm_mensajes_leidos", JSON.stringify(nuevosLeidos));

    if (isOnline) {
      const { data, error } = await supabase
        .from("comentarios")
        .select("*")
        .eq("incidencia_id", inc.id)
        .order("fecha", { ascending: true });
      if (!error && data) {
        setChatMessages(data);
        if (data.length > totalComentarios) {
          const ajustesLeidos = { ...nuevosLeidos, [inc.id]: data.length };
          setMensajesLeidos(ajustesLeidos);
          localStorage.setItem(
            "pm_mensajes_leidos",
            JSON.stringify(ajustesLeidos)
          );
        }
      }
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || enviandoMensaje) return;
    setEnviandoMensaje(true);
    const msg = {
      id: Date.now().toString(),
      incidencia_id: incidenciaSeleccionada.id,
      autor: userProfile?.nombre_completo || userProfile?.email || "Personal",
      mensaje: nuevoMensaje.trim(),
      fecha: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setNuevoMensaje("");
    setMensajesLeidos((prev) => {
      const upd = {
        ...prev,
        [msg.incidencia_id]: (prev[msg.incidencia_id] || 0) + 1,
      };
      localStorage.setItem("pm_mensajes_leidos", JSON.stringify(upd));
      return upd;
    });
    if (isOnline)
      await supabase
        .from("comentarios")
        .insert([
          {
            id: msg.id,
            incidencia_id: msg.incidencia_id,
            autor: msg.autor,
            mensaje: msg.mensaje,
            fecha: msg.fecha,
          },
        ]);
    setEnviandoMensaje(false);
  };

  const ejecutarAccionTicket = async (tipoAccion) => {
    if (tipoAccion === "Resuelta" && !fotoDespuesFile)
      return alert("Foto obligatoria.");
    if (tipoAccion === "Pendiente" && !motivoPendiente.trim())
      return alert("Justificación obligatoria.");
    setIsSubmitting(true);
    try {
      let urlSubida = null;
      if (tipoAccion === "Resuelta" && fotoDespuesFile)
        urlSubida = await subirFotoStorage(
          fotoDespuesFile,
          incidenciaSeleccionada.id,
          "resuelto"
        );
      const nuevosDatos =
        tipoAccion === "Resuelta"
          ? {
              estado: "Resuelta",
              observaciones_tecnico: observaciones,
              foto_resolucion_url: urlSubida,
            }
          : { estado: "Pendiente", motivo_pendiente: motivoPendiente };
      const { data, error } = await supabase
        .from("incidencias")
        .update(nuevosDatos)
        .eq("id", incidenciaSeleccionada.id)
        .select("*, comentarios(id)");
      if (error) throw error;
      setIncidenciasList((prev) =>
        prev.map((inc) =>
          inc.id === incidenciaSeleccionada.id ? data[0] : inc
        )
      );
      alert(
        tipoAccion === "Resuelta" ? "✅ Aviso RESUELTO." : "Aviso PENDIENTE."
      );
      setIncidenciaSeleccionada(null);
      setAccionActiva(null);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportarCSV = (tipo) => {
    const descargarCSV = (nombre, cabeceras, filas) => {
      const blob = new Blob(["\uFEFF" + cabeceras + "\n" + filas.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${nombre}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    };
    if (tipo === "incidencias")
      descargarCSV(
        "Incidencias",
        "Codigo,Titulo,Descripcion,Prioridad,Estado,Motivo,Destino,Fecha",
        incidenciasList.map(
          (i) =>
            `${i.codigo_ticket},"${i.titulo}","${i.descripcion}",${
              i.prioridad
            },${i.estado},"${i.motivo_pendiente || ""}",${
              i.departamento_destino
            },${new Date(i.fecha_creacion).toLocaleString()}`
        )
      );
    if (tipo === "fichajes")
      descargarCSV(
        "Fichajes",
        "ID,Empleado,Tipo,Fecha",
        historialFichajes.map(
          (f) =>
            `"${f.id}","${f.departamento}","${f.tipo_registro}","${new Date(
              f.fecha_hora
            ).toLocaleString()}"`
        )
      );
    if (tipo === "checklist")
      descargarCSV(
        "Checklist",
        "ID,Zona,Operario,Departamento,Estado,Fecha",
        checklistHistorial.map(
          (r) =>
            `"${r.id}","${r.zona}","${r.operario}","${r.departamento}","${
              r.estado
            }","${new Date(r.fecha).toLocaleString()}"`
        )
      );
  };

  if (loadingSession)
    return (
      <div className="min-h-screen flex items-center justify-center bg-pm-fondo">
        <div className="w-8 h-8 border-4 border-pm-verde border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  // =========================================================================
  // VISTA ESPECIAL 1: IMPRESIÓN DEL INFORME EXTRAORDINARIO (PDF)
  // =========================================================================
  if (informeAImprimir) {
    return (
      <div className="min-h-screen bg-gray-200 text-[#2B2D42] font-sans pb-10 print:pb-0 print:bg-white">
        <style>{`
          @page { size: A4 portrait; margin: 0; }
          @media print {
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .a4-container { width: 210mm; min-height: 297mm; margin: 0 !important; padding: 0 !important; box-shadow: none !important; page-break-after: always; break-after: page; }
            .no-print { display: none !important; }
          }
          @media screen {
            .a4-container { width: 210mm; min-height: 297mm; max-width: 100%; margin: 2rem auto; background: white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
          }
        `}</style>
        <div className="no-print w-full bg-red-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold">
            <FileWarning size={20} /> Generador Documento: Informe Intervención
            A4
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-[#E3A82B] hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={() => setInformeAImprimir(null)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="w-full flex flex-col items-center print:block">
          <div className="a4-container flex flex-col relative overflow-hidden">
            <div className="p-8 pb-4 border-b-[6px] border-[#E3A82B] bg-[#204136] text-white">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <img
                    src="/logo.png"
                    alt="Murias Parque Melilla"
                    className="h-14 w-auto object-contain mb-2 print:filter-none"
                  />
                  <p className="text-[#E3A82B] font-bold text-sm tracking-wide">
                    INFORME EXTRAORDINARIO DE INTERVENCIÓN
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="bg-white p-2 rounded-lg w-32 h-16 flex items-center justify-center shadow-sm">
                    <img
                      src="/logo-seguridad.png"
                      alt="Empresa de Seguridad"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-300 font-mono">
                      Ref. Oficial: {informeAImprimir.codigo_expediente}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      Fecha:{" "}
                      {new Date(informeAImprimir.fecha).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-10 py-8 flex-1 flex flex-col text-[13px]">
              <div className="mb-6">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">
                  1. Datos de Localización y Tipología
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">
                      Hora del incidente
                    </span>
                    <span className="font-mono font-bold text-base">
                      {informeAImprimir.hora} h
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">
                      Lugar exacto / Ubicación
                    </span>
                    <span className="font-bold">
                      {informeAImprimir.ubicacion_exacta}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">
                      Tipología del Hecho
                    </span>
                    <span className="font-bold text-[#E3A82B] text-base">
                      {informeAImprimir.tipologia}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">
                  2. Intervención de Fuerzas y Cuerpos de Seguridad /
                  Emergencias
                </h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                  <div className="flex gap-4">
                    <div className="w-2/3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        Cuerpo Interviniente Actuante
                      </span>
                      <span className="font-semibold">
                        {informeAImprimir.cuerpo_seguridad}
                      </span>
                    </div>
                    <div className="w-1/3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        Indicativo / Dotación
                      </span>
                      <span>{informeAImprimir.dotacion_policial || "---"}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        Nº Placas / Carné Profesional
                      </span>
                      <span>{informeAImprimir.numero_agentes || "---"}</span>
                    </div>
                    <div className="w-1/2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">
                        Nº Diligencias / Atestado Policial
                      </span>
                      <span>{informeAImprimir.numero_atestado || "---"}</span>
                    </div>
                  </div>
                </div>
              </div>
              {informeAImprimir.personas_implicadas && (
                <div className="mb-6">
                  <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">
                    3. Personas Implicadas, Retenidos y/o Testigos
                  </h3>
                  <div className="p-3 border border-gray-200 rounded whitespace-pre-wrap">
                    {informeAImprimir.personas_implicadas}
                  </div>
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">
                  4. Relato Circunstanciado de los Hechos
                </h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded text-justify leading-relaxed whitespace-pre-wrap">
                  {informeAImprimir.descripcion_detallada}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">
                  5. Preservación de Imágenes CCTV y Efectos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-gray-200 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Cámaras Acotadas / Custodiadas
                    </span>
                    <span className="whitespace-pre-wrap">
                      {informeAImprimir.camaras_cctv ||
                        "Sin cámaras asociadas."}
                    </span>
                  </div>
                  <div className="p-3 border border-gray-200 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Efectos recuperados o Daños
                    </span>
                    <span className="whitespace-pre-wrap">
                      {informeAImprimir.efectos_danos ||
                        "Sin efectos ni daños a destacar."}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-6 border-t-[3px] border-[#204136] flex justify-between items-end">
                <div className="w-1/2 pr-4 border-r border-gray-200">
                  <h3 className="text-xs font-bold uppercase text-[#204136] mb-4">
                    6. Diligencia de Emisión y Jefatura
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    CDAD PROP PARQUE MELILLA
                  </p>
                  <div className="h-16"></div>
                  <p className="text-[10px] font-bold uppercase border-t pt-1 w-3/4">
                    Visto Bueno Gerencia / Dir. Seguridad
                  </p>
                </div>
                <div className="w-1/2 pl-4 text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
                    Vigilante Interviniente y Redactor
                  </p>
                  <div className="h-20 flex items-center justify-center">
                    {informeAImprimir.firma_digital ? (
                      <img
                        src={informeAImprimir.firma_digital}
                        className="max-h-full max-w-full mix-blend-multiply"
                        alt="Firma Vigilante"
                      />
                    ) : (
                      <p className="text-[10px] italic text-gray-400">
                        Sin firma registrada
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase border-t pt-1 w-3/4 mx-auto">
                    {informeAImprimir.vigilante_nombre}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono">
                    TIP: {informeAImprimir.vigilante_tip}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center text-[9px] text-gray-400 p-3 border-t border-gray-100 bg-white">
              Documento Pericial Oficial - Generado por Parque Melilla Connect -
              parquemelilla.es
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA ESPECIAL 2: MODO IMPRESIÓN DEL PARTE DIARIO A4 (PDF)
  // =========================================================================
  if (parteAImprimir) {
    const turnosArr = [
      {
        id: "manana",
        titulo: "Turno Mañana (06:00 - 14:00)",
        data: parteAImprimir.turno_manana,
      },
      {
        id: "tarde",
        titulo: "Turno Tarde (14:00 - 22:00)",
        data: parteAImprimir.turno_tarde,
      },
      {
        id: "noche",
        titulo: "Turno Noche (22:00 - 06:00)",
        data: parteAImprimir.turno_noche,
      },
    ];
    const invImpresion = parteAImprimir.inventario || {
      walkies: "---",
      linternas: "---",
      moviles: "---",
      llaves_maestras: false,
      observaciones_material: "Sin observaciones",
    };

    return (
      <div className="min-h-screen bg-gray-200 text-[#2B2D42] font-sans pb-10 print:pb-0 print:bg-white">
        <style>{`
          @page { size: A4 portrait; margin: 0; }
          @media print {
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .a4-container { width: 210mm; min-height: 296mm; margin: 0 !important; padding: 0 !important; box-shadow: none !important; page-break-after: always; break-after: page; }
            .a4-container:last-of-type { page-break-after: auto; break-after: auto; }
            .no-print { display: none !important; }
          }
          @media screen {
            .a4-container { width: 210mm; min-height: 297mm; max-width: 100%; margin: 2rem auto; background: white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
          }
        `}</style>
        <div className="no-print w-full bg-[#204136] text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold">
            <FileText size={20} /> Generador Documento Oficial A4
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-[#E3A82B] hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={() => setParteAImprimir(null)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col items-center print:block">
          {turnosArr.map((turno, idx) => (
            <div
              key={turno.id}
              className="a4-container flex flex-col relative overflow-hidden"
            >
              <div className="p-8 pb-4 border-b-[6px] border-[#E3A82B] bg-[#204136] text-white">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <img
                      src="/logo.png"
                      alt="Murias Parque Melilla"
                      className="h-14 w-auto object-contain mb-2 print:filter-none"
                    />
                    <p className="text-[#E3A82B] font-bold text-sm tracking-wide">
                      PARTE DIARIO DE SEGURIDAD (24H)
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="bg-white p-2 rounded-lg w-32 h-16 flex items-center justify-center shadow-sm">
                      <img
                        src="/logo-seguridad.png"
                        alt="Empresa de Seguridad"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <span
                        style={{ display: "none" }}
                        className="text-[9px] text-gray-400 font-bold leading-tight uppercase text-center"
                      >
                        Falta archivo
                        <br />
                        logo-seguridad.png
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-300 font-mono">
                        Ref. SEC-{parteAImprimir.fecha.replace(/-/g, "")}
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {new Date(parteAImprimir.fecha).toLocaleDateString(
                          "es-ES"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-10 py-8 flex-1 flex flex-col">
                <div className="flex justify-between items-end border-b pb-4 mb-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                      Servicio Asignado
                    </p>
                    <p className="text-sm font-bold text-[#204136]">
                      CDAD PROP PARQUE MELILLA
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                      Estado Documento
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        parteAImprimir.estado === "Cerrado"
                          ? "text-green-700"
                          : "text-red-500"
                      }`}
                    >
                      {parteAImprimir.estado === "Cerrado"
                        ? "SELLADO OFICIAL"
                        : "EN CURSO (NO DEFINITIVO)"}
                    </p>
                  </div>
                </div>

                <h2 className="text-base font-black uppercase text-[#204136] mb-4 border-b-2 border-gray-300 pb-1">
                  {turno.titulo}
                </h2>
                <div className="w-full mb-8 border border-gray-300 rounded text-sm flex p-4 bg-gray-50">
                  <div className="w-1/2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Vigilante Responsable
                    </span>
                    <span className="font-bold text-base text-gray-800">
                      {turno.data?.vigilante_nombre || "Sin asignación"}
                    </span>
                  </div>
                  <div className="w-1/2 text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                      Número de TIP
                    </span>
                    <span className="font-mono text-base font-bold text-gray-800">
                      {turno.data?.vigilante_tip || "---"}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-widest">
                  Novedades Registradas
                </h3>
                <div className="space-y-4 mb-auto">
                  {!turno.data?.novedades ||
                  turno.data.novedades.length === 0 ? (
                    <p className="text-sm italic text-gray-500">
                      Sin novedades registradas durante el turno.
                    </p>
                  ) : (
                    turno.data.novedades.map((ent, i) => (
                      <div key={i} className="flex gap-4 items-start text-sm">
                        <span className="font-mono font-bold text-[#E3A82B] w-14 shrink-0">
                          [{ent.hora}]
                        </span>
                        <p className="flex-1 text-gray-800 border-b border-gray-100 pb-3 leading-relaxed">
                          {ent.texto}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {turno.id === "noche" && (
                  <div className="mt-8">
                    <h2 className="text-sm font-black uppercase text-[#204136] mb-4 border-b-2 border-gray-300 pb-1">
                      Control de Dotación e Inventario (Cierre)
                    </h2>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="border border-gray-200 p-3 rounded text-center bg-gray-50">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                          Walkies
                        </span>
                        <span className="text-xl font-bold">
                          {invImpresion.walkies}
                        </span>
                      </div>
                      <div className="border border-gray-200 p-3 rounded text-center bg-gray-50">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                          Linternas
                        </span>
                        <span className="text-xl font-bold">
                          {invImpresion.linternas}
                        </span>
                      </div>
                      <div className="border border-gray-200 p-3 rounded text-center bg-gray-50">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                          Móviles
                        </span>
                        <span className="text-xl font-bold">
                          {invImpresion.moviles}
                        </span>
                      </div>
                      <div className="border border-gray-200 p-3 rounded text-center bg-gray-50 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                          Llaves
                        </span>
                        <span className="text-base font-bold flex justify-center mt-1">
                          {invImpresion.llaves_maestras ? (
                            <CheckCircle size={20} className="text-green-600" />
                          ) : (
                            <X size={20} className="text-red-500" />
                          )}
                        </span>
                      </div>
                    </div>
                    {invImpresion.observaciones_material && (
                      <div className="mb-4 text-sm text-gray-700 italic border-l-4 border-[#E3A82B] pl-3 py-1">
                        " {invImpresion.observaciones_material} "
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 pt-4 border-t-2 border-[#204136] flex justify-between items-end">
                  <div className="w-1/2 pr-4 border-r border-gray-200 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
                      Responsable del Turno ({turno.id})
                    </p>
                    <div className="h-16 flex items-center justify-center">
                      {turno.data?.firma ? (
                        <img
                          src={turno.data.firma}
                          className="max-h-full max-w-full mix-blend-multiply"
                          alt="Firma Vigilante"
                        />
                      ) : (
                        <p className="text-[10px] italic text-gray-400">
                          Sin firma digital registrada
                        </p>
                      )}
                    </div>
                    <p className="text-xs font-bold uppercase border-t pt-1 w-3/4 mx-auto">
                      {turno.data?.vigilante_nombre || "---"}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono">
                      TIP: {turno.data?.vigilante_tip}
                    </p>
                  </div>

                  {turno.id === "noche" ? (
                    <div className="w-1/2 pl-4 text-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
                        CDAD PROP PARQUE MELILLA (Gerencia)
                      </p>
                      <div className="h-16"></div>
                      <p className="text-xs font-bold uppercase border-t pt-1 w-3/4 mx-auto">
                        Visto Bueno / Sello
                      </p>
                    </div>
                  ) : (
                    <div className="w-1/2 pl-4 text-center opacity-0">
                      <div className="h-16"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-[9px] text-gray-400 p-3 border-t border-gray-100 bg-white">
                Documento Oficial de Servicio - CDAD PROP PARQUE MELILLA - Pág.{" "}
                {idx + 1} de 3
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTAS NORMALES DE LA APLICACIÓN
  // =========================================================================

  if (!session) {
    return (
      <div className="min-h-screen bg-pm-fondo flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="bg-pm-verde p-8 text-center flex flex-col items-center">
            <img
              src="/logo.png"
              alt="Parque Melilla"
              className="h-14 w-auto object-contain drop-shadow-sm mb-3"
            />
            <h1 className="text-xl font-bold text-white tracking-wider">
              PARQUE MELILLA
            </h1>
            <p className="text-xs text-pm-ocre font-semibold tracking-widest uppercase mt-0.5">
              Connect • Gestión Operativa
            </p>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex gap-2">
                <ShieldAlert size={16} />
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:border-pm-verde outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:border-pm-verde outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-pm-ocre hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all"
            >
              {isLoggingIn ? "Accediendo..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pm-fondo text-pm-texto font-sans relative pb-20">
      {!isOnline && (
        <div className="bg-red-500 text-white text-[10px] font-bold py-1 flex justify-center gap-2 sticky top-0 z-50">
          <WifiOff size={12} /> SIN COBERTURA
        </div>
      )}

      {/* INPUTS OCULTOS DE CÁMARA Y GALERÍA (Disparados por los botones useRef) */}
      <input
        ref={camaraAvisoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoCapture(e, setFotoFile, setFotoPreview)}
        style={{ display: "none" }}
      />
      <input
        ref={galeriaAvisoRef}
        type="file"
        accept="image/*"
        onChange={(e) => handlePhotoCapture(e, setFotoFile, setFotoPreview)}
        style={{ display: "none" }}
      />
      <input
        ref={camaraResueltoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) =>
          handlePhotoCapture(e, setFotoDespuesFile, setFotoDespuesPreview)
        }
        style={{ display: "none" }}
      />
      <input
        ref={galeriaResueltoRef}
        type="file"
        accept="image/*"
        onChange={(e) =>
          handlePhotoCapture(e, setFotoDespuesFile, setFotoDespuesPreview)
        }
        style={{ display: "none" }}
      />

      {/* MODAL DE FIRMA TURNO DIARIO */}
      {turnoAFirmar && (
        <PanelFirma
          titulo={`Turno de ${turnoAFirmar}`}
          onCancelar={() => setTurnoAFirmar(null)}
          onGuardar={(firmaUrl) => confirmarCierreConFirma(firmaUrl)}
        />
      )}

      {/* MODAL DE FIRMA INFORME EXTRAORDINARIO */}
      {informeAFirmar && (
        <PanelFirma
          titulo="Informe Extraordinario"
          subtitulo="Sellado Judicial de"
          onCancelar={() => setInformeAFirmar(false)}
          onGuardar={(firmaUrl) => confirmarInformeConFirma(firmaUrl)}
        />
      )}

      {/* VISTA OPERARIO (HEADER Y MAIN) */}
      {activeTab === "operario" && (
        <>
          <header className="bg-pm-verde text-white p-4 shadow-md rounded-b-xl relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Parque Melilla"
                  className="h-10 w-auto object-contain"
                />
                <h1 className="text-lg font-bold">CONNECT</h1>
              </div>
              <div className="flex items-center gap-3">
                {esLimpieza &&
                  (estadoFichaje ? (
                    <span className="text-[10px] font-bold bg-green-500/30 px-3 py-1 rounded-full border border-green-400">
                      EN TURNO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-red-500/30 px-3 py-1 rounded-full border border-red-400">
                      FUERA DE TURNO
                    </span>
                  ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white cursor-pointer relative z-50"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs opacity-75">
                {userProfile?.nombre_completo}
              </p>
              <p className="text-lg font-bold text-pm-ocre">{miRol}</p>
            </div>
          </header>

          <main className="p-4 space-y-4 max-w-lg mx-auto">
            {esLimpieza && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex justify-between items-center shadow-sm">
                <p className="text-xs text-amber-800 font-bold flex gap-1.5">
                  <Clock size={16} /> Control Horario
                </p>
                <button
                  type="button"
                  onClick={() => setShowFichajeModal(true)}
                  className="bg-white border text-amber-700 px-3 py-1.5 rounded text-[10px] font-bold shadow-sm"
                >
                  Fichar
                </button>
              </div>
            )}

            {esSeguridad && (
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-white font-bold flex gap-2">
                    <Shield className="text-pm-ocre" size={20} /> Cuadrante
                    Operativo
                  </h2>
                  <span className="text-[10px] bg-pm-ocre text-white px-2 py-0.5 rounded font-bold uppercase">
                    Turno {turnoEnCurso}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Registro unificado de novedades.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={abrirModalParte}
                    className="w-full bg-pm-ocre text-white font-bold py-3 rounded-xl flex justify-center gap-2 shadow-sm"
                  >
                    <FileText size={18} /> Abrir Parte de Hoy
                  </button>
                  <button
                    type="button"
                    onClick={abrirModalInformeExtr}
                    className="w-full border border-red-400 bg-red-900/40 hover:bg-red-800/80 text-white font-bold py-2.5 rounded-xl text-xs flex justify-center gap-2 shadow-sm transition"
                  >
                    <FileWarning size={16} /> Redactar Informe Extraordinario
                  </button>
                </div>
              </div>
            )}

            {esLimpieza && estadoFichaje && rondasPendientes.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-sm">
                <h2 className="font-bold text-sm text-green-800 flex gap-1.5 mb-3">
                  <CheckSquare size={16} /> Rondas Diarias
                </h2>
                <div className="space-y-2">
                  {rondasPendientes.map((zona) => (
                    <div
                      key={zona}
                      className="flex justify-between items-center bg-white p-2.5 rounded-lg border shadow-sm"
                    >
                      <span className="text-xs font-bold text-gray-700">
                        {zona}
                      </span>
                      <button
                        type="button"
                        onClick={() => completarRonda(zona)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-[10px] font-bold"
                      >
                        Revisar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <h2 className="font-bold text-lg text-pm-verde flex items-center gap-2">
                <AlertTriangle size={18} className="text-pm-ocre" /> Tareas
                Asignadas
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (esLimpieza && !estadoFichaje) alert("Inicia turno.");
                  else {
                    setZonaNombre("");
                    setDepartamentoDestino("");
                    setShowForm(true);
                  }
                }}
                className="text-xs font-bold text-pm-ocre underline"
              >
                + Dar Aviso
              </button>
            </div>

            {incidenciasList
              .filter(
                (i) =>
                  i.estado !== "Resuelta" &&
                  (i.departamento_destino === miRol ||
                    i.departamento_destino === "General" ||
                    !i.departamento_destino)
              )
              .map((inc) => {
                const noLeidos = Math.max(
                  0,
                  (inc.comentarios?.length || 0) - (mensajesLeidos[inc.id] || 0)
                );
                return (
                  <div
                    key={inc.id}
                    onClick={() => abrirFicha(inc)}
                    className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer relative overflow-hidden"
                  >
                    {inc.prioridad?.includes("P1") && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>
                    )}
                    {inc.departamento_destino === "General" && (
                      <div className="absolute top-0 right-0 bg-pm-ocre text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg flex gap-1">
                        <Bell size={10} /> GENERAL
                      </div>
                    )}

                    <div className="flex justify-between items-start mt-2">
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            inc.prioridad?.includes("P1")
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inc.prioridad}
                        </span>
                        <span
                          className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inc.estado === "Resuelta"
                              ? "bg-green-100 text-green-700"
                              : inc.estado === "Pendiente"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {inc.estado}
                        </span>
                        <h3 className="font-bold text-gray-800 text-sm mt-1.5">
                          {inc.titulo}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {inc.descripcion}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 mt-1">
                        {noLeidos > 0 && (
                          <span className="flex gap-1 text-[10px] text-white font-bold bg-red-500 px-2 py-1 rounded-md animate-in zoom-in">
                            <MessageSquare size={12} /> {noLeidos} nuevo
                          </span>
                        )}
                        <Search size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
          </main>

          <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-10">
            <button
              type="button"
              onClick={() => {
                if (esLimpieza && !estadoFichaje) alert("Inicia turno.");
                else setIsScanning(true);
              }}
              className="w-full max-w-sm py-4 rounded-2xl shadow-lg font-bold text-lg flex justify-center gap-2 bg-pm-ocre text-white"
            >
              <Camera size={24} /> ESCANEAR QR AVISO
            </button>
          </div>
        </>
      )}

      {/* VISTA GERENCIA */}
      {activeTab === "gerencia" && (
        <div className="bg-gray-50 min-h-screen">
          <header className="bg-pm-verde text-white p-4 lg:px-8 shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Parque Melilla"
                  className="h-9 w-auto object-contain"
                />
                <div>
                  <h1 className="text-lg font-bold">Parque Melilla Connect</h1>
                  <p className="text-[11px] text-pm-ocre font-semibold uppercase">
                    Cuadro de Mando
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-white/10 rounded-lg p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => exportarCSV("incidencias")}
                    className="bg-pm-ocre text-white text-xs font-semibold px-2.5 py-1.5 rounded flex gap-1.5"
                  >
                    <Download size={13} /> Avisos
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarCSV("fichajes")}
                    className="bg-pm-ocre text-white text-xs font-semibold px-2.5 py-1.5 rounded flex gap-1.5"
                  >
                    <Download size={13} /> Fichajes
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarCSV("checklist")}
                    className="bg-pm-ocre text-white text-xs font-semibold px-2.5 py-1.5 rounded flex gap-1.5"
                  >
                    <Download size={13} /> Rondas
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                  <button
                    type="button"
                    onClick={cargarDatos}
                    className="bg-white/15 p-2 rounded-lg text-white"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-white/15 hover:bg-white/20 p-2 rounded-lg text-white cursor-pointer relative z-50"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Alertas Críticas
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                </div>
                <p className="text-3xl font-extrabold text-red-600 my-1">
                  {
                    incidenciasList.filter(
                      (i) =>
                        i.prioridad?.includes("P1") && i.estado !== "Resuelta"
                    ).length
                  }
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Avisos Abiertos
                </span>
                <p className="text-3xl font-extrabold text-amber-500 my-1">
                  {
                    incidenciasList.filter((i) => i.estado !== "Resuelta")
                      .length
                  }
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Avisos Resueltos
                </span>
                <p className="text-3xl font-extrabold text-green-600 my-1">
                  {
                    incidenciasList.filter((i) => i.estado === "Resuelta")
                      .length
                  }
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Rondas Verificadas
                </span>
                <p className="text-3xl font-extrabold text-pm-verde my-1">
                  {checklistHistorial.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden border-red-800">
                  <div className="bg-red-800 px-4 py-3 border-b border-red-900 flex justify-between items-center text-white">
                    <div className="flex gap-2 items-center">
                      <FileWarning size={16} className="text-[#E3A82B]" />
                      <h3 className="text-xs font-bold uppercase">
                        Informes de Intervención
                      </h3>
                    </div>
                  </div>
                  <div className="p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                    {informesIntervencionList.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No hay atestados registrados.
                      </p>
                    ) : (
                      informesIntervencionList.map((informe) => (
                        <div
                          key={informe.id}
                          onClick={() => setInformeAImprimir(informe)}
                          className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2.5 rounded-lg cursor-pointer hover:border-red-400 shadow-sm transition"
                        >
                          <div>
                            <p className="font-bold text-gray-800">
                              {new Date(informe.fecha).toLocaleDateString(
                                "es-ES"
                              )}
                            </p>
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              {informe.codigo_expediente}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="bg-gray-100 p-2 rounded-full text-red-800 hover:bg-red-800 hover:text-white transition-colors"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border rounded-xl shadow-sm overflow-hidden border-[#204136]">
                  <div className="bg-[#204136] px-4 py-3 border-b border-[#204136] flex justify-between items-center text-white">
                    <div className="flex gap-2 items-center">
                      <Shield size={16} className="text-[#E3A82B]" />
                      <h3 className="text-xs font-bold uppercase">
                        Partes de Seguridad 24H
                      </h3>
                    </div>
                  </div>
                  <div className="p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                    {partesSeguridadList.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No constan partes de servicio.
                      </p>
                    ) : (
                      partesSeguridadList.map((parte) => (
                        <div
                          key={parte.id}
                          onClick={() => setParteAImprimir(parte)}
                          className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2.5 rounded-lg cursor-pointer hover:border-[#E3A82B] shadow-sm transition"
                        >
                          <div>
                            <p className="font-bold text-gray-800">
                              {new Date(parte.fecha).toLocaleDateString(
                                "es-ES"
                              )}
                            </p>
                            <span
                              className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                parte.estado === "Cerrado"
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : "bg-green-50 text-green-600 border border-green-200"
                              }`}
                            >
                              {parte.estado === "Cerrado"
                                ? "SELLADO"
                                : "EN CURSO"}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="bg-gray-100 p-2 rounded-full text-[#204136] hover:bg-[#E3A82B] hover:text-white transition-colors"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                    <Clock size={16} className="text-pm-ocre" />
                    <h3 className="text-xs font-bold text-gray-700 uppercase">
                      Control Horario
                    </h3>
                  </div>
                  <div className="p-3 max-h-48 overflow-y-auto space-y-2">
                    {historialFichajes.map((fich) => (
                      <div
                        key={fich.id}
                        className="flex justify-between items-center text-xs border-b pb-2"
                      >
                        <p className="font-semibold text-gray-800">
                          {fich.departamento}{" "}
                          <span
                            className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              fich.tipo_registro === "ENTRADA"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {fich.tipo_registro}
                          </span>
                        </p>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {new Date(fich.fecha_hora).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Monitor de Avisos
                  </h2>
                  <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg flex-wrap">
                    {["Todas", "Registrada", "Pendiente", "Resuelta"].map(
                      (est) => (
                        <button
                          type="button"
                          key={est}
                          onClick={() => setFiltroEstado(est)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            filtroEstado === est
                              ? "bg-pm-verde text-white"
                              : "text-gray-600"
                          }`}
                        >
                          {est}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {incidenciasList
                    .filter(
                      (i) =>
                        filtroEstado === "Todas" || i.estado === filtroEstado
                    )
                    .map((inc) => {
                      const noLeidos = Math.max(
                        0,
                        (inc.comentarios?.length || 0) -
                          (mensajesLeidos[inc.id] || 0)
                      );
                      return (
                        <div
                          key={inc.id}
                          onClick={() => abrirFicha(inc)}
                          className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                inc.prioridad?.includes("P1")
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {inc.prioridad}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inc.estado === "Resuelta"
                                  ? "bg-green-100 text-green-700"
                                  : inc.estado === "Pendiente"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {inc.estado}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-gray-800 mb-1 group-hover:text-pm-verde">
                            {inc.titulo}
                          </h3>
                          <div className="mt-3 flex justify-between items-center text-[11px] text-gray-400">
                            <span className="flex items-center gap-1 font-semibold">
                              {inc.departamento_destino === "General" ? (
                                <Bell size={12} className="text-pm-ocre" />
                              ) : (
                                <Users size={12} />
                              )}{" "}
                              {inc.departamento_destino || "Mantenimiento"}
                            </span>
                            <div className="flex items-center gap-2">
                              {noLeidos > 0 && (
                                <span className="text-[10px] text-white font-bold bg-red-500 px-1.5 py-0.5 rounded-md">
                                  <MessageSquare size={10} className="inline" />{" "}
                                  {noLeidos}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALES DE ACCIÓN RESTAURADOS EN SU LUGAR ================= */}

      {/* 1. MODAL DETALLE DE INCIDENCIA / CHAT / RESOLUCIÓN */}
      {incidenciaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-3xl">
              <span className="text-xs font-bold text-gray-500">
                {incidenciaSeleccionada.codigo_ticket}
              </span>
              <button
                type="button"
                onClick={() => setIncidenciaSeleccionada(null)}
                className="bg-gray-200 text-gray-600 p-1.5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {incidenciaSeleccionada.foto_url && (
                <img
                  src={incidenciaSeleccionada.foto_url}
                  alt="Avería"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}
              <h2 className="text-lg font-bold text-gray-800 leading-tight mb-1">
                {incidenciaSeleccionada.titulo}
              </h2>
              <p className="text-sm text-gray-500 mb-4 flex gap-1">
                <MapPin size={14} className="text-pm-ocre" />{" "}
                {incidenciaSeleccionada.descripcion}
              </p>

              {incidenciaSeleccionada.estado === "Pendiente" && (
                <div className="bg-purple-50 p-3 rounded-xl mb-4">
                  <p className="text-xs font-bold text-purple-800">
                    Motivo Pausa:
                  </p>
                  <p className="text-sm italic">
                    "{incidenciaSeleccionada.motivo_pendiente}"
                  </p>
                </div>
              )}
              {incidenciaSeleccionada.estado === "Resuelta" && (
                <div className="bg-green-50 p-3 rounded-xl mb-4">
                  <p className="text-xs font-bold text-green-800">
                    Resolución:
                  </p>
                  <p className="text-sm italic mb-2">
                    "{incidenciaSeleccionada.observaciones_tecnico}"
                  </p>
                  {incidenciaSeleccionada.foto_resolucion_url && (
                    <img
                      src={incidenciaSeleccionada.foto_resolucion_url}
                      alt="Resolución"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 mb-3">
                  Chat del Aviso
                </h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                  {chatMessages.map((msg) => {
                    const esMio =
                      msg.autor ===
                      (userProfile?.nombre_completo || userProfile?.email);
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          esMio ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-[9px] text-gray-400 font-bold mx-1">
                          {msg.autor}
                        </span>
                        <div
                          className={`p-2.5 rounded-2xl text-sm max-w-[85%] ${
                            esMio
                              ? "bg-pm-verde text-white rounded-tr-none"
                              : "bg-white border rounded-tl-none"
                          }`}
                        >
                          {msg.mensaje}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>
                <form onSubmit={enviarMensaje} className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    disabled={enviandoMensaje}
                    className="flex-1 border rounded-full px-4 text-sm outline-none focus:border-pm-verde"
                    placeholder="Escribe..."
                  />
                  <button
                    type="submit"
                    disabled={!nuevoMensaje.trim()}
                    className="bg-pm-ocre text-white p-2.5 rounded-full"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

              {incidenciaSeleccionada.estado !== "Resuelta" && (
                <div className="mt-6 border-t pt-4">
                  {!accionActiva ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAccionActiva("resolver")}
                        className="w-1/2 bg-pm-verde text-white font-bold py-3 rounded-xl"
                      >
                        <CheckCircle size={16} className="inline mr-1" />{" "}
                        RESOLVER
                      </button>
                      {incidenciaSeleccionada.estado !== "Pendiente" && (
                        <button
                          type="button"
                          onClick={() => setAccionActiva("pendiente")}
                          className="w-1/2 bg-purple-600 text-white font-bold py-3 rounded-xl"
                        >
                          <Clock size={16} className="inline mr-1" /> PENDIENTE
                        </button>
                      )}
                    </div>
                  ) : accionActiva === "resolver" ? (
                    <form
                      onSubmit={() => ejecutarAccionTicket("Resuelta")}
                      className="bg-gray-50 p-4 rounded-xl space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                          Foto del Trabajo Finalizado *
                        </label>
                        {fotoDespuesPreview ? (
                          <div className="relative mb-2">
                            <img
                              src={fotoDespuesPreview}
                              className="h-32 w-full object-cover rounded-xl border border-gray-200"
                              alt="Resuelto"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFotoDespuesFile(null);
                                setFotoDespuesPreview(null);
                              }}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => camaraResueltoRef.current?.click()}
                              className="border-2 border-dashed border-green-600 bg-green-50/50 hover:bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center shadow-sm"
                            >
                              <Camera
                                className="text-green-700 mb-1"
                                size={24}
                              />
                              <span className="text-xs font-bold text-green-800">
                                Hacer Foto
                              </span>
                              <span className="text-[10px] text-gray-400">
                                Cámara
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                galeriaResueltoRef.current?.click()
                              }
                              className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center shadow-sm"
                            >
                              <Upload
                                className="text-gray-400 mb-1"
                                size={24}
                              />
                              <span className="text-xs font-bold text-gray-700">
                                Galería
                              </span>
                              <span className="text-[10px] text-gray-400">
                                Archivo
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Detalla el trabajo..."
                        className="w-full border rounded-lg p-2 text-sm outline-none focus:border-pm-verde"
                        required
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAccionActiva(null)}
                          className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm"
                        >
                          Atrás
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 bg-pm-verde text-white font-bold py-3 rounded-lg"
                        >
                          Marcar Resuelto
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={() => ejecutarAccionTicket("Pendiente")}
                      className="bg-purple-50 p-4 rounded-xl space-y-4"
                    >
                      <textarea
                        value={motivoPendiente}
                        onChange={(e) => setMotivoPendiente(e.target.value)}
                        placeholder="Motivo de la pausa..."
                        className="w-full border rounded-lg p-2 text-sm outline-none focus:border-purple-600"
                        required
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAccionActiva(null)}
                          className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm"
                        >
                          Atrás
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 bg-purple-600 text-white font-bold py-3 rounded-lg"
                        >
                          Pausar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL INFORME EXTRAORDINARIO DE INTERVENCIÓN */}
      {showInformeExtr && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[95vh] h-full sm:h-auto overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-red-900 text-white sm:rounded-t-3xl">
              <div>
                <div className="flex gap-2">
                  <FileWarning size={18} className="text-[#E3A82B]" />
                  <span className="font-bold text-sm">
                    Redactar Informe de Intervención
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInformeExtr(false)}
                className="text-gray-300 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-gray-50 space-y-5">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">
                  1. Localización y Tipología
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Hora Incidente *
                    </label>
                    <input
                      type="time"
                      value={informeHora}
                      onChange={(e) => setInformeHora(e.target.value)}
                      className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Tipología *
                    </label>
                    <select
                      value={datosInforme.tipologia}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          tipologia: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900"
                    >
                      <option>Hurto / Robo</option>
                      <option>Altercado / Agresión</option>
                      <option>Intervención Policial</option>
                      <option>Emergencia Médica / 061</option>
                      <option>Daños Materiales / Vandalismo</option>
                      <option>Desalojo / Otros</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Lugar exacto (Local, Pasillo...) *
                    </label>
                    <input
                      type="text"
                      value={datosInforme.ubicacion_exacta}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          ubicacion_exacta: e.target.value,
                        })
                      }
                      placeholder="Ej: Puerta local Zara P1"
                      className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">
                  2. Intervención Policial / Emergencias
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Cuerpo Interviniente
                    </label>
                    <select
                      value={datosInforme.cuerpo_seguridad}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          cuerpo_seguridad: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900"
                    >
                      <option>Cuerpo Nacional de Policía (CNP)</option>
                      <option>Policía Local</option>
                      <option>Guardia Civil</option>
                      <option>061 / Asistencia Sanitaria</option>
                      <option>Sin intervención de FFCCSE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Indicativo / Dotación
                    </label>
                    <input
                      type="text"
                      value={datosInforme.dotacion_policial}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          dotacion_policial: e.target.value,
                        })
                      }
                      placeholder="Ej: Z-14"
                      className="w-full border rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Nº Placas Agentes
                    </label>
                    <input
                      type="text"
                      value={datosInforme.numero_agentes}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          numero_agentes: e.target.value,
                        })
                      }
                      placeholder="Ej: 104230 y 112004"
                      className="w-full border rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Nº Atestado / Diligencias (Opcional)
                    </label>
                    <input
                      type="text"
                      value={datosInforme.numero_atestado}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          numero_atestado: e.target.value,
                        })
                      }
                      placeholder="Referencia si la hubiese"
                      className="w-full border rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">
                  3. Relato Circunstanciado *
                </h3>
                <div className="relative">
                  <textarea
                    value={datosInforme.descripcion_detallada}
                    onChange={(e) =>
                      setDatosInforme({
                        ...datosInforme,
                        descripcion_detallada: e.target.value,
                      })
                    }
                    placeholder="Narra los hechos de forma objetiva y cronológica..."
                    className="w-full border rounded-lg p-3 pr-10 text-xs min-h-[120px] outline-none focus:border-red-900"
                  ></textarea>
                  <button
                    type="button"
                    onClick={alternarDictadoInforme}
                    className={`absolute right-2 bottom-2 p-2 rounded-full ${
                      isListeningInforme
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-gray-100 text-gray-500"
                    }`}
                    title="Dictar por voz"
                  >
                    <Mic size={16} />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 mt-2">
                    Personas Implicadas / Testigos
                  </label>
                  <textarea
                    value={datosInforme.personas_implicadas}
                    onChange={(e) =>
                      setDatosInforme({
                        ...datosInforme,
                        personas_implicadas: e.target.value,
                      })
                    }
                    placeholder="Identificaciones si procede..."
                    className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none"
                  ></textarea>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">
                  4. Cámaras CCTV y Efectos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Cámaras Acotadas
                    </label>
                    <textarea
                      value={datosInforme.camaras_cctv}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          camaras_cctv: e.target.value,
                        })
                      }
                      placeholder="Ej: Cam-04 Pasillo"
                      className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Efectos o Daños
                    </label>
                    <textarea
                      value={datosInforme.efectos_danos}
                      onChange={(e) =>
                        setDatosInforme({
                          ...datosInforme,
                          efectos_danos: e.target.value,
                        })
                      }
                      placeholder="Mercancía, roturas..."
                      className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2 mb-3">
                  5. Vigilante Redactor
                </h3>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Número de TIP *
                </label>
                <input
                  type="text"
                  value={datosInforme.vigilante_tip}
                  onChange={(e) =>
                    setDatosInforme({
                      ...datosInforme,
                      vigilante_tip: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900"
                  placeholder="Obligatorio para la firma"
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t">
              <button
                type="button"
                onClick={iniciarFirmaInforme}
                className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-md flex justify-center items-center gap-2 transition-colors"
              >
                <PenTool size={18} /> VALIDAR Y FIRMAR INFORME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL PARTE DE SEGURIDAD 24H (EDICIÓN Y LLENADO) */}
      {showParteSeguridad && !parteAImprimir && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[95vh] h-full sm:h-auto">
            <div className="p-4 border-b flex justify-between items-center bg-gray-800 text-white rounded-t-3xl sm:rounded-t-3xl">
              <div>
                <div className="flex gap-2">
                  <Shield className="text-pm-ocre" size={18} />
                  <span className="font-bold text-sm">
                    CDAD PROP PARQUE MELILLA
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono mt-0.5">
                  Fecha: {parteFecha}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    parteEstado === "Cerrado"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {parteEstado.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setShowParteSeguridad(false)}
                  className="text-gray-300 hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-gray-50 space-y-4">
              <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl">
                {["Mañana", "Tarde", "Noche"].map((t) => {
                  const esElActual = turnoEnCurso === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setPestañaTurnoVer(t)}
                      className={`py-2 text-xs font-bold rounded-lg relative ${
                        pestañaTurnoVer === t
                          ? "bg-gray-800 text-white shadow-md"
                          : "text-gray-600"
                      }`}
                    >
                      {t}
                      {esElActual && (
                        <span className="block text-[8px] text-pm-ocre uppercase">
                          En Curso
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700 uppercase">
                    Vigilante Turno {pestañaTurnoVer}
                  </span>
                  {!puedeEditarTurno(pestañaTurnoVer) && (
                    <span className="text-[10px] text-gray-400 italic">
                      Solo lectura
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={datosTurnos[pestañaTurnoVer].vigilante_nombre}
                      onChange={(e) =>
                        setDatosTurnos((prev) => ({
                          ...prev,
                          [pestañaTurnoVer]: {
                            ...prev[pestañaTurnoVer],
                            vigilante_nombre: e.target.value,
                          },
                        }))
                      }
                      disabled={!puedeEditarTurno(pestañaTurnoVer)}
                      className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Nº TIP
                    </label>
                    <input
                      type="text"
                      value={datosTurnos[pestañaTurnoVer].vigilante_tip}
                      onChange={(e) =>
                        setDatosTurnos((prev) => ({
                          ...prev,
                          [pestañaTurnoVer]: {
                            ...prev[pestañaTurnoVer],
                            vigilante_tip: e.target.value,
                          },
                        }))
                      }
                      disabled={!puedeEditarTurno(pestañaTurnoVer)}
                      className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 flex gap-1.5">
                  <ClipboardList size={14} className="text-pm-ocre" /> Novedades{" "}
                  {pestañaTurnoVer}
                </h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {datosTurnos[pestañaTurnoVer].novedades.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">
                      Sin novedades.
                    </p>
                  ) : (
                    datosTurnos[pestañaTurnoVer].novedades.map((ent) => (
                      <div
                        key={ent.id}
                        className={`p-2.5 rounded-lg border flex gap-2.5 relative pr-7 text-xs ${
                          ent.texto.includes("🔴 Intervención")
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded border ${
                            ent.texto.includes("🔴 Intervención")
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-white text-gray-700"
                          }`}
                        >
                          {ent.hora}
                        </span>
                        <p
                          className={`flex-1 ${
                            ent.texto.includes("🔴 Intervención")
                              ? "text-red-900 font-semibold"
                              : "text-gray-800"
                          }`}
                        >
                          {ent.texto}
                        </p>
                        {puedeEditarTurno(pestañaTurnoVer) && (
                          <button
                            type="button"
                            onClick={() => eliminarNovedadTurno(ent.id)}
                            className="absolute right-2 top-2 text-red-400"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {puedeEditarTurno(pestañaTurnoVer) && (
                  <div className="border-t pt-3">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="time"
                        value={nuevaEntradaHora}
                        onChange={(e) => setNuevaEntradaHora(e.target.value)}
                        className="border rounded-lg px-2 text-xs w-24"
                      />
                      <div className="relative flex-1">
                        <textarea
                          value={nuevaEntradaTexto}
                          onChange={(e) => setNuevaEntradaTexto(e.target.value)}
                          placeholder="Describe la novedad..."
                          className="w-full border rounded-lg p-2 pr-9 text-xs min-h-[56px]"
                        ></textarea>
                        <button
                          type="button"
                          onClick={alternarDictado}
                          className={`absolute right-1.5 bottom-2 p-1.5 rounded-full ${
                            isListening
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Mic size={15} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={agregarNovedadTurno}
                      className="w-full bg-gray-100 text-gray-800 font-bold text-xs py-2 rounded-lg flex justify-center gap-1 border"
                    >
                      <Plus size={14} /> Añadir Novedad
                    </button>
                  </div>
                )}
              </div>

              {pestañaTurnoVer === "Noche" && (
                <div className="bg-white p-4 rounded-xl border shadow-sm mt-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 flex gap-1.5">
                    <Shield size={14} className="text-pm-ocre" /> Dotación Común
                    (Cierre)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Walkie Talkies
                      </label>
                      <input
                        type="number"
                        value={inventario.walkies}
                        onChange={(e) =>
                          setInventario({
                            ...inventario,
                            walkies: e.target.value,
                          })
                        }
                        disabled={!puedeEditarTurno(pestañaTurnoVer)}
                        className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Linternas
                      </label>
                      <input
                        type="number"
                        value={inventario.linternas}
                        onChange={(e) =>
                          setInventario({
                            ...inventario,
                            linternas: e.target.value,
                          })
                        }
                        disabled={!puedeEditarTurno(pestañaTurnoVer)}
                        className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Móvil Servicio
                      </label>
                      <input
                        type="number"
                        value={inventario.moviles}
                        onChange={(e) =>
                          setInventario({
                            ...inventario,
                            moviles: e.target.value,
                          })
                        }
                        disabled={!puedeEditarTurno(pestañaTurnoVer)}
                        className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 border rounded-lg p-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inventario.llaves_maestras}
                          onChange={(e) =>
                            setInventario({
                              ...inventario,
                              llaves_maestras: e.target.checked,
                            })
                          }
                          disabled={!puedeEditarTurno(pestañaTurnoVer)}
                          className="w-4 h-4 text-pm-verde"
                        />
                        Juego Llaves Maestro
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Observaciones Material
                    </label>
                    <textarea
                      value={inventario.observaciones_material}
                      onChange={(e) =>
                        setInventario({
                          ...inventario,
                          observaciones_material: e.target.value,
                        })
                      }
                      disabled={!puedeEditarTurno(pestañaTurnoVer)}
                      placeholder="Ej: Walkie 2 con batería baja..."
                      className="w-full border rounded-lg p-2 text-xs min-h-[40px] disabled:bg-gray-50"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t space-y-2">
              {puedeEditarTurno(pestañaTurnoVer) && (
                <>
                  <button
                    type="button"
                    onClick={() => guardarAvanceParte(pestañaTurnoVer)}
                    disabled={isSubmitting}
                    className="w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl flex justify-center gap-2 border shadow-sm"
                  >
                    <Save size={16} />{" "}
                    {isSubmitting
                      ? "Guardando..."
                      : `Guardar Borrador (${pestañaTurnoVer})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => iniciarCierreTurno(pestañaTurnoVer)}
                    disabled={isSubmitting}
                    className={`w-full font-bold py-3 rounded-xl text-sm flex justify-center gap-1.5 shadow-sm ${
                      pestañaTurnoVer === "Noche"
                        ? "border border-red-300 bg-red-50 text-red-700"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    <PenTool size={16} />{" "}
                    {pestañaTurnoVer === "Noche"
                      ? "Firmar y Sellar Parte Completo"
                      : `Firmar y Cerrar (${pestañaTurnoVer})`}
                  </button>
                </>
              )}
              {parteEstado !== "Cerrado" &&
                datosTurnos[pestañaTurnoVer]?.cerrado && (
                  <div className="bg-green-50 text-green-700 text-center py-2.5 rounded-xl text-xs font-bold flex justify-center gap-1.5 border border-green-200">
                    <CheckCircle size={14} /> Turno de {pestañaTurnoVer} firmado
                    y cerrado
                  </div>
                )}
              {parteEstado === "Cerrado" && (
                <div className="bg-gray-100 text-gray-500 text-center py-2.5 rounded-xl text-xs font-bold flex justify-center gap-1.5 border">
                  <CandadoIcon size={14} /> Este parte de 24 horas ha sido
                  sellado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL CREAR AVISO CON DOBLE BOTÓN DE CÁMARA DIRECTA Y GALERÍA */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-pm-verde">Reportar Aviso</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitCreacion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Dirigido a *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Mantenimiento", "Limpieza", "Seguridad", "General"].map(
                    (dep) => (
                      <button
                        key={dep}
                        type="button"
                        onClick={() => setDepartamentoDestino(dep)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                          departamentoDestino === dep
                            ? dep === "General"
                              ? "bg-pm-ocre text-white border-pm-ocre shadow-md"
                              : "bg-pm-verde text-white border-pm-verde shadow-md"
                            : "bg-white text-gray-700"
                        }`}
                      >
                        {dep === "General" ? "📣 General" : dep}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Ubicación / Zona *
                </label>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-pm-ocre" />
                  <select
                    value={zonaNombre}
                    onChange={(e) => setZonaNombre(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none"
                  >
                    <option value="" disabled>
                      Selecciona la zona...
                    </option>
                    <option value="Aseos Galería P0">Aseos Galería P0</option>
                    <option value="Parking Subterráneo">
                      Parking Subterráneo
                    </option>
                    <option value="Cuarto Técnico">Cuarto Técnico</option>
                    <option value="Pasillo Principal">Pasillo Principal</option>
                    <option value="Plaza Central">Plaza Central</option>
                  </select>
                </div>
              </div>

              {/* SELECCIÓN DE FOTO: CÁMARA DIRECTA vs GALERÍA */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Foto Previa{" "}
                  {departamentoDestino === "General" && (
                    <span className="normal-case font-normal text-gray-400">
                      (Opcional)
                    </span>
                  )}
                </label>

                {fotoPreview ? (
                  <div className="relative mb-2">
                    <img
                      src={fotoPreview}
                      className="h-36 w-full object-cover rounded-xl border border-gray-200 shadow-sm"
                      alt="Vista previa"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFotoFile(null);
                        setFotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => camaraAvisoRef.current?.click()}
                      className="border-2 border-dashed border-[#E3A82B] bg-amber-50/50 hover:bg-amber-50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center shadow-sm"
                    >
                      <Camera className="text-[#E3A82B] mb-1" size={24} />
                      <span className="text-xs font-bold text-[#204136]">
                        Hacer Foto
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Cámara directa
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galeriaAvisoRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center shadow-sm"
                    >
                      <Upload className="text-gray-400 mb-1" size={24} />
                      <span className="text-xs font-bold text-gray-700">
                        Galería
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Elegir archivo
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Título del Aviso *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Fuga de agua..."
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-pm-verde"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-pm-ocre hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all"
              >
                {isSubmitting ? "Guardando..." : "Enviar Aviso"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL ESCANEO QR */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-4 bg-pm-verde flex justify-between items-center">
            <h2 className="text-white font-bold">Escanear QR</h2>
            <button
              type="button"
              onClick={() => setIsScanning(false)}
              className="bg-red-500 text-white p-1 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 w-full flex items-center justify-center relative">
            <Scanner
              onScan={(r) => handleScan(r[0].rawValue)}
              formats={["qr_code"]}
            />
            <div className="absolute border-2 border-pm-ocre w-64 h-64 rounded-xl opacity-60"></div>
          </div>
        </div>
      )}

      {/* 6. MODAL CONTROL HORARIO (FICHAJE) */}
      {showFichajeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
            <h2 className="text-xl font-bold">Control Horario</h2>
            {!estadoFichaje ? (
              <button
                type="button"
                onClick={() => registrarFichaje("ENTRADA")}
                className="w-full bg-pm-verde text-white font-bold py-4 rounded-xl shadow-lg"
              >
                INICIAR TURNO
              </button>
            ) : (
              <button
                type="button"
                onClick={() => registrarFichaje("SALIDA")}
                className="w-full bg-pm-ocre text-white font-bold py-4 rounded-xl shadow-lg"
              >
                FINALIZAR TURNO
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFichajeModal(false)}
              className="text-sm text-gray-400 underline block mx-auto"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN MÓVIL GERENCIA */}
      {esGerente && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around pb-safe z-40 h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("operario")}
            className={`flex flex-col items-center justify-center w-full ${
              activeTab === "operario" ? "text-pm-ocre" : "text-gray-400"
            }`}
          >
            <ClipboardList size={24} />
            <span className="text-[10px] font-bold">Operativa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gerencia")}
            className={`flex flex-col items-center justify-center w-full ${
              activeTab === "gerencia" ? "text-pm-ocre" : "text-gray-400"
            }`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-bold">Supervisión</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
