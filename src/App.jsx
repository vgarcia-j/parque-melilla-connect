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
  Sparkles,
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

// --- HELPER RGPD: OBTENCIÓN SEGURA DE FOTOS MEDIANTE URL FIRMADA (Art. 32 LOPD-GDD) ---
export const obtenerUrlSegura = async (rutaArchivo) => {
  if (!rutaArchivo) return null;
  if (rutaArchivo.startsWith("data:image") || rutaArchivo.startsWith("blob:")) return rutaArchivo;

  const nombreLimpio = rutaArchivo.includes("/") ? rutaArchivo.split("/").pop() : rutaArchivo;
  const { data, error } = await supabase.storage.from("fotos").createSignedUrl(nombreLimpio, 3600);
  
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
      obtenerUrlSegura(ruta).then((urlFirmada) => {
        if (montado && urlFirmada) setUrl(urlFirmada);
      });
    }
    return () => { montado = false; };
  }, [ruta]);

  if (!url) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center text-[10px] text-gray-500 ${className}`}>
        Cargando evidencia...
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} />;
};

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

  // ACCESO CON USUARIO CORPORATIVO (DOMINIO FANTASMA)
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState("operario");

  // ESTADOS GLOBALES DE DATOS
  const [incidenciasList, setIncidenciasList] = useState([]);
  const [partesSeguridadList, setPartesSeguridadList] = useState([]);
  const [informesIntervencionList, setInformesIntervencionList] = useState([]);
  const [checklistHistorial, setChecklistHistorial] = useState([]);
  const [directorioPersonal, setDirectorioPersonal] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todas");

  // FILTROS AVANZADOS DEL DASHBOARD DE GERENCIA
  const [filtroDepartamentoGerencia, setFiltroDepartamentoGerencia] = useState("Todos");
  const [busquedaGerencia, setBusquedaGerencia] = useState("");

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

  // ESTADOS DEL SUPERVISOR DE LIMPIEZA
  const [showModalRepaso, setShowModalRepaso] = useState(false);
  const [repasoZona, setRepasoZona] = useState("Aseos Galería P0");
  const [repasoOperario, setRepasoOperario] = useState("");
  const [repasoHora, setRepasoHora] = useState("");
  const [repasoTipo, setRepasoTipo] = useState("Repaso de Aseos");
  const [repasoObservaciones, setRepasoObservaciones] = useState("");

  // ESTADOS DEL PARTE DIARIO (24H)
  const [showParteSeguridad, setShowParteSeguridad] = useState(false);
  const [parteAImprimir, setParteAImprimir] = useState(null);
  const [turnoAFirmar, setTurnoAFirmar] = useState(null);

  const [parteId, setParteId] = useState(null);
  const [parteFecha, setParteFecha] = useState("");
  const [parteEstado, setParteEstado] = useState("Abierto");
  const [pestañaTurnoVer, setPestañaTurnoVer] = useState("Mañana");
  const [turnoEnCurso, setTurnoEnCurso] = useState("Mañana");

  const [datosTurnos, setDatosTurnos] = useState({
    Mañana: { vigilante_nombre: "", vigilante_tip: "", novedades: [], firma: null, cerrado: false },
    Tarde: { vigilante_nombre: "", vigilante_tip: "", novedades: [], firma: null, cerrado: false },
    Noche: { vigilante_nombre: "", vigilante_tip: "", novedades: [], firma: null, cerrado: false },
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

  // ESTADOS DEL INFORME EXTRAORDINARIO
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

  // LÓGICA DE TURNOS SEGURIDAD
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
      else if (turno === "Tarde" && datosActuales.Tarde?.cerrado) turno = "Noche";
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

  // EFECTOS GLOBALES
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
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    }
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
      else setUserProfile(null);
      setLoadingSession(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // INICIO DE SESIÓN CON DOMINIO FANTASMA
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    
    const identificador = loginUsername.trim().toLowerCase();
    const emailFinal = identificador.includes("@") 
      ? identificador 
      : `${identificador}@parquemelilla.es`;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailFinal,
      password: loginPassword,
    });
    if (error) setLoginError("Usuario o contraseña incorrectos.");
    setIsLoggingIn(false);
  };

  // CIERRE DE SESIÓN CON PURGA RGPD
  const handleLogout = async () => {
    try {
      for (let key in localStorage) {
        if (key.startsWith("sb-")) localStorage.removeItem(key);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setSession(null);
      setUserProfile(null);
      setActiveTab("operario");
      setLoginUsername("");
      setLoginPassword("");
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

      const { data: rondas } = await supabase
        .from("rondas_checklist")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(50);
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

        if (miRolActual === "Gerencia") {
          const { data: perfiles } = await supabase
            .from("perfiles_usuarios")
            .select("*")
            .order("rol", { ascending: true });
          if (perfiles) setDirectorioPersonal(perfiles);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(() => cargarDatos(), 6000);
    const canalRealtime = supabase
      .channel("cambios-bd-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidencias" }, () => cargarDatos())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comentarios" }, () => cargarDatos())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rondas_checklist" }, () => cargarDatos())
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

  // ================= FUNCIONES SUPERVISOR DE LIMPIEZA =================
  const abrirModalRepaso = (zonaDefecto = "") => {
    const ahora = new Date();
    setRepasoHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora.getMinutes().toString().padStart(2, "0")}`
    );
    setRepasoZona(zonaDefecto || "Aseos Galería P0");
    setRepasoOperario("");
    setRepasoTipo("Repaso de Aseos");
    setRepasoObservaciones("");
    setShowModalRepaso(true);
  };

  const guardarRegistroRepaso = async (e) => {
    e.preventDefault();
    if (!repasoOperario.trim() || !repasoZona || !repasoHora) {
      return alert("⚠️ Indica la zona, el operario ejecutor y la hora del trabajo.");
    }

    const ahora = new Date();
    if (ahora.getHours() === 23 && ahora.getMinutes() >= 59) {
      return alert(
        "⛔ REGISTRO DENEGADO:\nEl día operativo ha concluido a las 23:59 h. No se pueden registrar o certificar tareas con posterioridad."
      );
    }

    setIsSubmitting(true);
    const idGenerado = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

    const nuevoRegistro = {
      id: idGenerado,
      zona: repasoZona,
      operario: `${repasoOperario.trim()} (Supervisado por: ${userProfile?.nombre_completo || "Supervisor Limpieza"})`,
      departamento: "Limpieza",
      estado: `${repasoTipo} [${repasoHora} h] - ${repasoObservaciones.trim() || "OK"}`,
      fecha: ahora.toISOString(),
    };

    try {
      if (isOnline) {
        const { error } = await supabase.from("rondas_checklist").insert([nuevoRegistro]);
        if (error) throw error;
      }
      setChecklistHistorial((prev) => [nuevoRegistro, ...prev]);
      alert(`✅ Certificado registrado con éxito en la jornada de hoy.`);
      setShowModalRepaso(false);
      cargarDatos();
    } catch (err) {
      alert(`❌ Error al certificar trabajo: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ENVÍO AUTOMÁTICO POR EMAIL DEL PARTE DIARIO CONSOLIDADO ---
  const enviarPartePorEmail = async (parteData) => {
    try {
      const { data, error } = await supabase.functions.invoke("enviar-parte-seguridad", {
        body: {
          parte: parteData,
          email_subcontrata: "mmadrid@pycseca.com",
          email_gerencia: "vgarcia@lyc-consultores.com, selua@lyc-consultores.com",
        },
      });

      if (error) throw error;
      console.log("Notificación por email enviada correctamente:", data);
    } catch (err) {
      console.warn("Aviso en despacho de email automático:", err.message);
    }
  };

  // ================= FUNCIONES DEL PARTE DE SEGURIDAD 24H =================
  const abrirModalParte = async () => {
    const { fechaISO, turnoDefault } = getTurnoYFechaOperativa();
    setParteFecha(fechaISO);
    const ahora = new Date();
    setNuevaEntradaHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora.getMinutes().toString().padStart(2, "0")}`
    );

    let turnosCargados = {
      Mañana: { vigilante_nombre: "", vigilante_tip: "", novedades: [], firma: null, cerrado: false },
      Tarde: { vigilante_nombre: "", vigilante_tip: "", novedades: [], firma: null, cerrado: false },
      Noche: { vigilante_nombre: "", vigilante_tip: "", novedades: [], firma: null, cerrado: false },
    };

    try {
      const { data, error } = await supabase
        .from("partes_seguridad")
        .select("*")
        .eq("fecha", fechaISO)
        .maybeSingle();

      if (!error && data) {
        setParteId(data.id);
        setParteEstado(data.estado || "Abierto");
        turnosCargados = {
          Mañana: { ...turnosCargados.Mañana, ...(data.turno_manana || {}), novedades: data.turno_manana?.novedades || [] },
          Tarde: { ...turnosCargados.Tarde, ...(data.turno_tarde || {}), novedades: data.turno_tarde?.novedades || [] },
          Noche: { ...turnosCargados.Noche, ...(data.turno_noche || {}), novedades: data.turno_noche?.novedades || [] },
        };
        setInventario({ ...inventario, ...(data.inventario || {}) });
      } else {
        setParteId(null);
        setParteEstado("Abierto");
      }
    } catch (err) {
      console.error("Error al sincronizar con base de datos:", err);
    }

    // Auto-rellenar credenciales si el turno activo aún no tiene vigilante asignado
    const { turnoDefault: turnoReal } = getTurnoYFechaOperativa(turnosCargados);
    if (!turnosCargados[turnoReal]?.vigilante_nombre && userProfile?.nombre_completo && userProfile?.tip) {
      turnosCargados[turnoReal].vigilante_nombre = userProfile.nombre_completo;
      turnosCargados[turnoReal].vigilante_tip = userProfile.tip;
    }

    setDatosTurnos(turnosCargados);
    setTurnoEnCurso(turnoReal);
    setPestañaTurnoVer(turnoReal);
    setShowParteSeguridad(true);
  };

  const agregarNovedadTurno = () => {
    if (!nuevaEntradaHora || !nuevaEntradaTexto.trim()) return alert("Indica la hora y novedad.");
    setDatosTurnos((prev) => ({
      ...prev,
      [pestañaTurnoVer]: {
        ...prev[pestañaTurnoVer],
        novedades: [
          ...(prev[pestañaTurnoVer]?.novedades || []),
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
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora.getMinutes().toString().padStart(2, "0")}`
    );
  };

  const eliminarNovedadTurno = (id) => {
    setDatosTurnos((prev) => ({
      ...prev,
      [pestañaTurnoVer]: {
        ...prev[pestañaTurnoVer],
        novedades: (prev[pestañaTurnoVer]?.novedades || []).filter((n) => n.id !== id),
      },
    }));
  };

  const alternarDictado = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Tu navegador no soporta dictado directo.");
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setNuevaEntradaTexto((prev) =>
        prev ? prev + " " + event.results[0][0].transcript : event.results[0][0].transcript
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const guardarAvanceParte = async (turno) => {
    const turnoDatos = datosTurnos[turno];
    if (!turnoDatos?.vigilante_nombre?.trim() || !turnoDatos?.vigilante_tip?.trim()) {
      return alert(`Indica tu Nombre y nº de TIP en el turno de ${turno} antes de guardar.`);
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

  // BLOQUEO ESTRICTO FUERA DE LA VENTANA DE RELEVO (±15 MIN)
  const iniciarCierreTurno = (turno) => {
    const turnoDatos = datosTurnos[turno];
    if (!turnoDatos?.vigilante_nombre?.trim() || !turnoDatos?.vigilante_tip?.trim()) {
      return alert("Debes rellenar Nombre y TIP antes de cerrar.");
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
      return alert(
        `⛔ CIERRE BLOQUEADO:\nEstás fuera de la ventana horaria oficial de relevo (±15 min).\n\n• Mañana: 13:45 - 14:15 h\n• Tarde: 21:45 - 22:15 h\n• Noche: 05:45 - 06:15 h\n\nDurante la guardia debes usar el botón 'Guardar Borrador'.`
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
    if (turno === "Noche") {
      payload.cerrado_por = `${nuevosDatosTurno.Noche.vigilante_nombre} (TIP: ${nuevosDatosTurno.Noche.vigilante_tip})`;
    }

    try {
      const { error } = await supabase
        .from("partes_seguridad")
        .upsert([payload], { onConflict: "fecha" })
        .select();
      if (error) throw error;
      setDatosTurnos(nuevosDatosTurno);
      setTurnoAFirmar(null);

      if (turno === "Noche") {
        setParteEstado("Cerrado");
        await enviarPartePorEmail(payload);
        alert(`🔒 Parte Diario CERRADO y SELLADO.\n\nSe ha emitido copia oficial por email a la contrata y a Gerencia.\nCerrando sesión para el relevo...`);
        setShowParteSeguridad(false);
      } else {
        const siguienteTurno = turno === "Mañana" ? "Tarde" : "Noche";
        alert(
          `🔒 Turno de ${turno} firmado y cerrado correctamente.\n\nEl servicio queda transferido al turno de ${siguienteTurno}.\nCerrando sesión para el relevo...`
        );
        setTurnoEnCurso(siguienteTurno);
        setPestañaTurnoVer(siguienteTurno);
      }
      cargarDatos();
      await handleLogout();
    } catch (err) {
      alert(`❌ Error al cerrar: ${err.message}`);
      nuevosDatosTurno[turno].cerrado = false;
      nuevosDatosTurno[turno].firma = null;
      setDatosTurnos(nuevosDatosTurno);
      setTurnoAFirmar(null);
      setIsSubmitting(false);
    }
  };

  // ================= FUNCIONES DEL INFORME EXTRAORDINARIO =================
  const abrirModalInformeExtr = () => {
    const ahora = new Date();
    setInformeHora(
      `${ahora.getHours().toString().padStart(2, "0")}:${ahora.getMinutes().toString().padStart(2, "0")}`
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
      vigilante_tip: userProfile?.tip || "",
    });
    setShowInformeExtr(true);
  };

  const alternarDictadoInforme = () => {
    if (isListeningInforme && recognitionInformeRef.current) {
      recognitionInformeRef.current.stop();
      setIsListeningInforme(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Tu navegador no soporta dictado directo.");
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
    if (!datosInforme.ubicacion_exacta || !datosInforme.descripcion_detallada || !datosInforme.vigilante_tip) {
      return alert("Rellena al menos los campos obligatorios (*).");
    }
    setInformeAFirmar(true);
  };

  const confirmarInformeConFirma = async (firmaUrl) => {
    setIsSubmitting(true);
    const codExpediente = `INT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
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
      vigilante_nombre: userProfile?.nombre_completo || "Vigilante de Seguridad",
      vigilante_tip: datosInforme.vigilante_tip,
      firma_digital: firmaUrl,
    };

    try {
      const { error } = await supabase.from("informes_intervencion").insert([payload]);
      if (error) throw error;

      const { turnoDefault, fechaISO } = getTurnoYFechaOperativa();
      const notaAuto = `🔴 Intervención de seguridad / ${datosInforme.tipologia} en ${datosInforme.ubicacion_exacta}. Se instruye y sella el Informe Extraordinario Ref. ${codExpediente}.`;

      const { data: pdData } = await supabase
        .from("partes_seguridad")
        .select("*")
        .eq("fecha", fechaISO)
        .maybeSingle();

      if (pdData && pdData.estado !== "Cerrado") {
        const pdTurnoClave = `turno_${turnoDefault.toLowerCase().replace("ñ", "n")}`;
        const turnoObj = pdData[pdTurnoClave] || {
          vigilante_nombre: userProfile?.nombre_completo,
          vigilante_tip: datosInforme.vigilante_tip,
          novedades: [],
          cerrado: false,
        };
        turnoObj.novedades = turnoObj.novedades || [];
        turnoObj.novedades.push({ id: Date.now(), hora: informeHora, texto: notaAuto });
        await supabase.from("partes_seguridad").update({ [pdTurnoClave]: turnoObj }).eq("id", pdData.id);
      }

      alert(`✅ INFORME EXTRAORDINARIO SELLADO CON ÉXITO.\nReferencia Oficial: ${codExpediente}`);
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
      const { error } = await supabase.storage.from("fotos").upload(fileName, file);
      if (error) return null;
      return fileName;
    } catch (err) {
      return null;
    }
  };

  const handleScan = (resultado) => {
    if (!resultado) return;
    setIsScanning(false);
    if (esLimpieza) {
      abrirModalRepaso(resultado);
    } else {
      setZonaNombre(resultado);
      setShowForm(true);
    }
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
    if (!zonaNombre || !departamentoDestino || (!fotoFile && departamentoDestino !== "General")) {
      return alert("Rellena los campos obligatorios (*).");
    }
    setIsSubmitting(true);

    const idGenerado = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const codigoTicket = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaActual = new Date().toISOString();
    const nombreArchivo = await subirFotoStorage(fotoFile, idGenerado, "previo");

    const registroBD = {
      id: idGenerado,
      codigo_ticket: codigoTicket,
      titulo: titulo,
      descripcion: `Ubicación: ${zonaNombre}`,
      prioridad: prioridad,
      estado: "Registrada",
      departamento_destino: departamentoDestino,
      fecha_creacion: fechaActual,
      foto_url: nombreArchivo,
    };

    const nuevoTicketLocal = { ...registroBD, comentarios: [] };

    if (isOnline) {
      const { data: ticketInsertado, error } = await supabase.from("incidencias").insert([registroBD]).select();
      if (error) {
        alert(`❌ Error BD: ${error.message}`);
        setIsSubmitting(false);
        return;
      }
      const creado = ticketInsertado && ticketInsertado[0] ? { ...ticketInsertado[0], comentarios: [] } : nuevoTicketLocal;
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
          localStorage.setItem("pm_mensajes_leidos", JSON.stringify(ajustesLeidos));
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
      const upd = { ...prev, [msg.incidencia_id]: (prev[msg.incidencia_id] || 0) + 1 };
      localStorage.setItem("pm_mensajes_leidos", JSON.stringify(upd));
      return upd;
    });
    if (isOnline) {
      await supabase.from("comentarios").insert([{
        id: msg.id,
        incidencia_id: msg.incidencia_id,
        autor: msg.autor,
        mensaje: msg.mensaje,
        fecha: msg.fecha,
      }]);
    }
    setEnviandoMensaje(false);
  };

  const ejecutarAccionTicket = async (tipoAccion, e) => {
    if (e) e.preventDefault();
    if ((tipoAccion === "Pendiente Validación" || tipoAccion === "Resuelta") && !fotoDespuesFile && !incidenciaSeleccionada.foto_resolucion_url) {
      return alert("La foto del trabajo terminado es obligatoria.");
    }
    if (tipoAccion === "Pendiente" && !motivoPendiente.trim()) {
      return alert("Justificación obligatoria.");
    }
    
    setIsSubmitting(true);
    try {
      let nombreArchivo = incidenciaSeleccionada.foto_resolucion_url;
      if (tipoAccion === "Pendiente Validación" && fotoDespuesFile) {
        nombreArchivo = await subirFotoStorage(fotoDespuesFile, incidenciaSeleccionada.id, "resuelto");
      }

      let nuevosDatos = {};
      if (tipoAccion === "Pendiente Validación") {
        nuevosDatos = { estado: "Pendiente Validación", observaciones_tecnico: observaciones, foto_resolucion_url: nombreArchivo };
      } else if (tipoAccion === "Resuelta") { 
        nuevosDatos = { estado: "Resuelta" };
      } else if (tipoAccion === "Rechazada") {
        nuevosDatos = { estado: "Registrada" }; 
      } else {
        nuevosDatos = { estado: "Pendiente", motivo_pendiente: motivoPendiente };
      }
      
      const { data, error } = await supabase.from("incidencias").update(nuevosDatos).eq("id", incidenciaSeleccionada.id).select("*, comentarios(id)");
      if (error) throw error;

      if (tipoAccion === "Rechazada" && observaciones) {
        const msgId = Date.now().toString();
        await supabase.from("comentarios").insert([{ 
          id: msgId, incidencia_id: incidenciaSeleccionada.id, autor: "GERENCIA (Control de Calidad)", 
          mensaje: `⚠️ TRABAJO RECHAZADO: ${observaciones}`, fecha: new Date().toISOString() 
        }]);
      }

      setIncidenciasList((prev) => prev.map((inc) => (inc.id === incidenciaSeleccionada.id ? { ...data[0], comentarios: inc.comentarios } : inc)));
      alert(tipoAccion === "Resuelta" ? "✅ Trabajo Aprobado y Avería Cerrada." : tipoAccion === "Rechazada" ? "❌ Trabajo Rechazado." : "Aviso actualizado.");
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
      const blob = new Blob(["\uFEFF" + cabeceras + "\n" + filas.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${nombre}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    };
    if (tipo === "incidencias") {
      descargarCSV(
        "Incidencias",
        "Codigo,Titulo,Descripcion,Prioridad,Estado,Motivo,Destino,Fecha",
        incidenciasList.map((i) => `${i.codigo_ticket},"${i.titulo}","${i.descripcion}",${i.prioridad},${i.estado},"${i.motivo_pendiente || ""}",${i.departamento_destino},${new Date(i.fecha_creacion).toLocaleString()}`)
      );
    }
    if (tipo === "repasos") {
      descargarCSV(
        "Supervision_Limpieza_Repasos",
        "ID,Zona,Operario_Y_Supervisor,Departamento,Labor_Realizada,Fecha_Y_Hora",
        checklistHistorial.map((r) => `"${r.id}","${r.zona}","${r.operario}","${r.departamento}","${r.estado}","${new Date(r.fecha).toLocaleString()}"`)
      );
    }
    if (tipo === "seguridad") {
      const filas = [];
      partesSeguridadList.forEach((p) => {
        ["Mañana", "Tarde", "Noche"].forEach((t) => {
          const turnoObj = p[`turno_${t.toLowerCase().replace("ñ", "n")}`];
          if (turnoObj && turnoObj.novedades) {
            turnoObj.novedades.forEach((nov) => {
              filas.push(`"${p.fecha}","${p.servicio}","${p.estado}","${t}","${turnoObj.vigilante_nombre}","${turnoObj.vigilante_tip}","${nov.hora}","${(nov.texto || "").replace(/"/g, '""')}"`);
            });
          }
        });
      });
      descargarCSV("Partes_Seguridad_24H", "Fecha,Servicio,Estado,Turno,Vigilante,TIP,Hora,Novedad", filas);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pm-fondo">
        <div className="w-8 h-8 border-4 border-pm-verde border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            <FileWarning size={20} /> Generador Documento: Informe Intervención A4
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
          <div className="a4-container flex flex-col relative overflow-hidden bg-white">
            <div className="p-8 pb-4 border-b-[6px] border-[#E3A82B] bg-[#204136] text-white">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <img src="/logo.png" alt="Murias Parque Melilla" className="h-14 w-auto object-contain mb-2 print:filter-none" />
                  <p className="text-[#E3A82B] font-bold text-sm tracking-wide">INFORME EXTRAORDINARIO DE INTERVENCIÓN</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="bg-white p-2 rounded-lg w-32 h-16 flex items-center justify-center shadow-sm">
                    <img
                      src="/logo-seguridad.png"
                      alt="Empresa de Seguridad"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-300 font-mono">Ref. Oficial: {informeAImprimir.codigo_expediente}</p>
                    <p className="text-lg font-bold mt-1">Fecha: {new Date(informeAImprimir.fecha).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-10 py-8 flex-1 flex flex-col text-[13px]">
              <div className="mb-6">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">1. Datos de Localización y Tipología</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Hora del incidente</span>
                    <span className="font-mono font-bold text-base">{informeAImprimir.hora} h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Lugar exacto / Ubicación</span>
                    <span className="font-bold">{informeAImprimir.ubicacion_exacta}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Tipología del Hecho</span>
                    <span className="font-bold text-[#E3A82B] text-base">{informeAImprimir.tipologia}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">2. Intervención de Fuerzas y Cuerpos de Seguridad / Emergencias</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                  <div className="flex gap-4">
                    <div className="w-2/3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Cuerpo Interviniente Actuante</span>
                      <span className="font-semibold">{informeAImprimir.cuerpo_seguridad}</span>
                    </div>
                    <div className="w-1/3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Indicativo / Dotación</span>
                      <span>{informeAImprimir.dotacion_policial || "---"}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Nº Placas / Carné Profesional</span>
                      <span>{informeAImprimir.numero_agentes || "---"}</span>
                    </div>
                    <div className="w-1/2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Nº Diligencias / Atestado Policial</span>
                      <span>{informeAImprimir.numero_atestado || "---"}</span>
                    </div>
                  </div>
                </div>
              </div>
              {informeAImprimir.personas_implicadas && (
                <div className="mb-6">
                  <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">3. Personas Implicadas, Retenidos y/o Testigos</h3>
                  <div className="p-3 border border-gray-200 rounded whitespace-pre-wrap">{informeAImprimir.personas_implicadas}</div>
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">4. Relato Circunstanciado de los Hechos</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded text-justify leading-relaxed whitespace-pre-wrap">{informeAImprimir.descripcion_detallada}</div>
              </div>
              <div className="mb-8">
                <h3 className="font-bold uppercase text-[#204136] border-b border-gray-300 pb-1 mb-2">5. Preservación de Imágenes CCTV y Efectos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-gray-200 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Cámaras Acotadas / Custodiadas</span>
                    <span className="whitespace-pre-wrap">{informeAImprimir.camaras_cctv || "Sin cámaras asociadas."}</span>
                  </div>
                  <div className="p-3 border border-gray-200 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Efectos recuperados o Daños</span>
                    <span className="whitespace-pre-wrap">{informeAImprimir.efectos_danos || "Sin efectos ni daños a destacar."}</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-6 border-t-[3px] border-[#204136] flex justify-between items-end">
                <div className="w-1/2 pr-4 border-r border-gray-200">
                  <h3 className="text-xs font-bold uppercase text-[#204136] mb-4">6. Diligencia de Emisión y Jefatura</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">CDAD PROP PARQUE MELILLA</p>
                  <div className="h-16"></div>
                  <p className="text-[10px] font-bold uppercase border-t pt-1 w-3/4">Visto Bueno Gerencia / Dir. Seguridad</p>
                </div>
                <div className="w-1/2 pl-4 text-center">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Vigilante Interviniente y Redactor</p>
                  <div className="h-20 flex items-center justify-center">
                    {informeAImprimir.firma_digital ? (
                      <img src={informeAImprimir.firma_digital} className="max-h-full max-w-full mix-blend-multiply" alt="Firma Vigilante" />
                    ) : (
                      <p className="text-[10px] italic text-gray-400">Sin firma registrada</p>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase border-t pt-1 w-3/4 mx-auto">{informeAImprimir.vigilante_nombre}</p>
                  <p className="text-[9px] text-gray-500 font-mono">TIP: {informeAImprimir.vigilante_tip}</p>
                </div>
              </div>
            </div>
            <div className="text-center text-[9px] text-gray-400 p-3 border-t border-gray-100 bg-white">
              Documento Pericial Oficial - Generado por Parque Melilla Connect - parquemelilla.es
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA ESPECIAL 2: MODO IMPRESIÓN DEL PARTE DIARIO A4 (FORMATO OFICIAL COMPACTO)
  // =========================================================================
  if (parteAImprimir) {
    const turnosArr = [
      { id: "manana", titulo: "Turno Mañana (06:00 - 14:00)", data: parteAImprimir.turno_manana },
      { id: "tarde", titulo: "Turno Tarde (14:00 - 22:00)", data: parteAImprimir.turno_tarde },
      { id: "noche", titulo: "Turno Noche (22:00 - 06:00)", data: parteAImprimir.turno_noche },
    ];
    const invImpresion = parteAImprimir.inventario || {
      walkies: "---",
      linternas: "---",
      moviles: "---",
      llaves_maestras: false,
      observaciones_material: "",
    };

    return (
      <div className="min-h-screen bg-gray-200 text-[#2B2D42] font-sans pb-10 print:pb-0 print:bg-white">
        <style>{`
          @page { size: A4 portrait; margin: 0; }
          @media print {
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .a4-container { width: 210mm !important; min-height: 297mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; page-break-after: always; break-after: page; }
            .a4-container:last-of-type { page-break-after: auto; break-after: auto; }
            .no-print { display: none !important; }
          }
          @media screen {
            .a4-container { width: 210mm; min-height: 297mm; max-width: 100%; margin: 1.5rem auto; background: white; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
          }
        `}</style>

        <div className="no-print w-full bg-[#204136] text-white p-3 shadow-md flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold text-sm">
            <FileText size={18} /> Generador Documento Oficial A4 • Parte Diario
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-[#E3A82B] hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-xs text-xs"
            >
              <Printer size={15} /> Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={() => setParteAImprimir(null)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col items-center print:block">
          {turnosArr.map((turno, idx) => (
            <div key={turno.id} className="a4-container flex flex-col relative overflow-hidden bg-white">
              <div className="px-6 py-3 bg-[#204136] text-white border-b-[4px] border-[#E3A82B]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Murias Parque Melilla" className="h-10 w-auto object-contain print:filter-none" />
                    <div className="border-l border-white/20 pl-3">
                      <p className="text-[10px] text-[#E3A82B] font-bold tracking-wider uppercase">CDAD PROP PARQUE MELILLA</p>
                      <h1 className="text-sm font-extrabold tracking-wide text-white">PARTE DIARIO DE SEGURIDAD (24H)</h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-md w-28 h-10 flex items-center justify-center shadow-2xs">
                      <img
                        src="/logo-seguridad.png"
                        alt="Empresa de Seguridad"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <span style={{ display: "none" }} className="text-[8px] text-gray-400 font-bold leading-tight uppercase text-center">
                        logo-seguridad.png
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-300 font-mono">Ref. SEC-{parteAImprimir.fecha.replace(/-/g, "")}</p>
                      <p className="text-xs font-bold text-white mt-0.5">{new Date(parteAImprimir.fecha).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 border-b border-gray-200 px-6 py-1.5 flex justify-between items-center text-[10px]">
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-[#204136] uppercase">{turno.titulo}</span>
                  <span className="text-gray-600"><strong>Vigilante:</strong> {turno.data?.vigilante_nombre || "Sin asignación"}</span>
                  <span className="text-gray-600 font-mono"><strong>TIP:</strong> {turno.data?.vigilante_tip || "---"}</span>
                </div>
                <div>
                  <span className={`font-black uppercase px-2 py-0.5 rounded text-[9px] ${
                    parteAImprimir.estado === "Cerrado" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {parteAImprimir.estado === "Cerrado" ? "Sellado Oficial" : "En Curso"}
                  </span>
                </div>
              </div>

              <div className="px-6 py-3 flex-1 flex flex-col justify-start">
                <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cronograma de Novedades del Servicio</h3>
                  <span className="text-[9px] text-gray-400 font-mono font-bold">{turno.data?.novedades?.length || 0} anotaciones</span>
                </div>

                <div className="space-y-1 mb-auto">
                  {!turno.data?.novedades || turno.data.novedades.length === 0 ? (
                    <p className="text-[10.5px] italic text-gray-400 py-6 text-center">Sin novedades registradas durante este turno de servicio.</p>
                  ) : (
                    turno.data.novedades.map((ent, i) => (
                      <div key={i} className="flex gap-2.5 items-start text-[10.5px] leading-snug border-b border-gray-100 pb-1">
                        <span className="font-mono font-bold text-[#E3A82B] text-[10px] w-10 shrink-0 pt-0.5">[{ent.hora}]</span>
                        <p className={`flex-1 ${(ent.texto || "").includes("🔴 Intervención") ? "text-red-900 font-bold bg-red-50/60 p-1 rounded" : "text-gray-800"}`}>
                          {ent.texto}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {turno.id === "noche" && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <h4 className="text-[9.5px] font-bold uppercase text-[#204136] mb-1.5 tracking-wider">
                      Control de Dotación e Inventario de Garita (Cierre de Servicio)
                    </h4>
                    <div className="grid grid-cols-4 gap-2 mb-1">
                      <div className="border border-gray-200 px-2 py-1 rounded bg-gray-50 text-center">
                        <span className="text-[8px] uppercase font-bold text-gray-500 block">Walkies</span>
                        <span className="text-xs font-bold text-gray-800">{invImpresion.walkies}</span>
                      </div>
                      <div className="border border-gray-200 px-2 py-1 rounded bg-gray-50 text-center">
                        <span className="text-[8px] uppercase font-bold text-gray-500 block">Linternas</span>
                        <span className="text-xs font-bold text-gray-800">{invImpresion.linternas}</span>
                      </div>
                      <div className="border border-gray-200 px-2 py-1 rounded bg-gray-50 text-center">
                        <span className="text-[8px] uppercase font-bold text-gray-500 block">Móvil Servicio</span>
                        <span className="text-xs font-bold text-gray-800">{invImpresion.moviles}</span>
                      </div>
                      <div className="border border-gray-200 px-2 py-1 rounded bg-gray-50 text-center flex flex-col justify-center">
                        <span className="text-[8px] uppercase font-bold text-gray-500 block">Llaves Maestras</span>
                        <span className="text-[10px] font-bold text-emerald-700">{invImpresion.llaves_maestras ? "CONFORME" : "NO CONFORME"}</span>
                      </div>
                    </div>
                    {invImpresion.observaciones_material && (
                      <p className="text-[9px] text-gray-600 italic border-l-2 border-[#E3A82B] pl-2 py-0.5">"{invImpresion.observaciones_material}"</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto px-6 py-2 border-t border-[#204136] flex justify-between items-end bg-gray-50/30">
                <div className="w-1/2 pr-4 border-r border-gray-200 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Responsable del Turno ({turno.id})</p>
                  <div className="h-11 flex items-center justify-center">
                    {turno.data?.firma ? (
                      <img src={turno.data.firma} className="max-h-full max-w-full mix-blend-multiply" alt="Firma Vigilante" />
                    ) : (
                      <p className="text-[9px] italic text-gray-400">Sin firma registrada</p>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase border-t border-gray-300 pt-0.5 w-44 mx-auto">{turno.data?.vigilante_nombre || "---"}</p>
                  <p className="text-[8.5px] text-gray-500 font-mono">TIP: {turno.data?.vigilante_tip || "---"}</p>
                </div>

                <div className="w-1/2 pl-4 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">CDAD PROP PARQUE MELILLA (Gerencia)</p>
                  <div className="h-11 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase px-2 py-0.5 border border-emerald-300 rounded bg-emerald-50">Conforme Servicio</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase border-t border-gray-300 pt-0.5 w-44 mx-auto">Visto Bueno / Sello</p>
                </div>
              </div>

              <div className="text-center text-[8px] text-gray-400 py-1 border-t border-gray-100 bg-white">
                Documento Oficial de Servicio - CDAD PROP PARQUE MELILLA - Pág. {idx + 1} de 3
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA OPERATIVA Y GERENCIA
  // =========================================================================
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
            {loginError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex gap-2">
                <ShieldAlert size={16} />
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Usuario Corporativo</label>
              <input
                type="text"
                required
                placeholder="Ej: nombre.apellido o reten"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm focus:border-pm-verde outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Contraseña</label>
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

          <div className="mx-6 mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left text-xs text-pm-texto">
            <div className="flex items-center gap-1.5 font-bold text-pm-verde mb-1.5">
              <span>ℹ️</span>
              <span>PROTECCIÓN DE DATOS</span>
            </div>
            <ul className="space-y-1 text-[11px] leading-tight text-gray-600">
              <li><strong>Responsable:</strong> CDAD PROP PARQUE MELILLA.</li>
              <li><strong>Finalidad:</strong> Coordinación técnica y operativa de instalaciones.</li>
              <li><strong>Legitimación:</strong> Ejecución de contrato y cumplimiento legal.</li>
              <li><strong>Derechos:</strong> Acceso, rectificación y supresión en <em>gerencia@parquemelilla.es</em>.</li>
            </ul>
          </div>
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

      {/* Inputs para cámaras */}
      <input ref={camaraAvisoRef} type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoCapture(e, setFotoFile, setFotoPreview)} style={{ display: "none" }} />
      <input ref={galeriaAvisoRef} type="file" accept="image/*" onChange={(e) => handlePhotoCapture(e, setFotoFile, setFotoPreview)} style={{ display: "none" }} />
      <input ref={camaraResueltoRef} type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoCapture(e, setFotoDespuesFile, setFotoDespuesPreview)} style={{ display: "none" }} />
      <input ref={galeriaResueltoRef} type="file" accept="image/*" onChange={(e) => handlePhotoCapture(e, setFotoDespuesFile, setFotoDespuesPreview)} style={{ display: "none" }} />

      {/* Modales de firmas */}
      {turnoAFirmar && (
        <PanelFirma
          titulo={`Turno de ${turnoAFirmar}`}
          onCancelar={() => setTurnoAFirmar(null)}
          onGuardar={(firmaUrl) => confirmarCierreConFirma(firmaUrl)}
        />
      )}

      {informeAFirmar && (
        <PanelFirma
          titulo="Informe Extraordinario"
          subtitulo="Sellado Judicial de"
          onCancelar={() => setInformeAFirmar(false)}
          onGuardar={(firmaUrl) => confirmarInformeConFirma(firmaUrl)}
        />
      )}

      {/* PESTAÑA OPERARIO */}
      {activeTab === "operario" && (
        <>
          <header className="bg-pm-verde text-white p-4 shadow-md rounded-b-xl relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Parque Melilla" className="h-10 w-auto object-contain" />
                <h1 className="text-lg font-bold">CONNECT</h1>
              </div>
              <div className="flex items-center gap-3">
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
              <p className="text-xs opacity-75">{userProfile?.nombre_completo}</p>
              <p className="text-lg font-bold text-pm-ocre">{esLimpieza ? "Supervisor de Limpieza" : miRol}</p>
            </div>
          </header>

          <main className="p-4 space-y-4 max-w-lg mx-auto">
            {esLimpieza && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles size={18} className="text-emerald-700" /> Control y Supervisión de Limpieza
                    </h2>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Auditoría in situ de repasos, aseos y zonas comunes.</p>
                  </div>
                </div>

                <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-900 leading-tight">
                  <Clock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Regla Obligatoria:</strong> Toda labor realizada debe registrarse antes de las <strong>23:59 h</strong> de hoy.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => abrirModalRepaso()}
                  className="w-full bg-pm-verde hover:bg-emerald-900 text-white font-bold py-3 rounded-xl text-xs flex justify-center items-center gap-2 shadow-sm transition"
                >
                  <Plus size={16} /> + Certificar Trabajo / Repaso de Zona
                </button>

                {checklistHistorial.filter((c) => c.departamento === "Limpieza").length > 0 && (
                  <div className="pt-2 border-t border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase mb-2">
                      Últimos Repasos Certificados Hoy ({checklistHistorial.filter((c) => c.departamento === "Limpieza").length}):
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {checklistHistorial
                        .filter((c) => c.departamento === "Limpieza")
                        .slice(0, 5)
                        .map((c) => (
                          <div key={c.id} className="bg-white p-2 rounded-lg border border-emerald-100 text-[11px] flex justify-between items-center shadow-xs">
                            <div>
                              <span className="font-bold text-gray-800 block">{c.zona}</span>
                              <span className="text-[10px] text-gray-500">{c.operario}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {new Date(c.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {esSeguridad && (
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-white font-bold flex gap-2">
                    <Shield className="text-pm-ocre" size={20} /> Cuadrante Operativo
                  </h2>
                  <span className="text-[10px] bg-pm-ocre text-white px-2 py-0.5 rounded font-bold uppercase">
                    Turno {turnoEnCurso}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-4">Registro unificado de novedades.</p>
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

            <div className="flex justify-between items-center pt-2">
              <h2 className="font-bold text-lg text-pm-verde flex items-center gap-2">
                <AlertTriangle size={18} className="text-pm-ocre" /> Tareas Asignadas
              </h2>
              <button
                type="button"
                onClick={() => {
                  setZonaNombre("");
                  setDepartamentoDestino("");
                  setShowForm(true);
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
                  (i.departamento_destino === miRol || i.departamento_destino === "General" || !i.departamento_destino)
              )
              .map((inc) => {
                const noLeidos = Math.max(0, (inc.comentarios?.length || 0) - (mensajesLeidos[inc.id] || 0));
                return (
                  <div
                    key={inc.id}
                    onClick={() => abrirFicha(inc)}
                    className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer relative overflow-hidden"
                  >
                    {inc.prioridad?.includes("P1") && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>}
                    {inc.departamento_destino === "General" && (
                      <div className="absolute top-0 right-0 bg-pm-ocre text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg flex gap-1">
                        <Bell size={10} /> GENERAL
                      </div>
                    )}
                    <div className="flex justify-between items-start mt-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${inc.prioridad?.includes("P1") ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                          {inc.prioridad}
                        </span>
                        <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inc.estado === "Resuelta" ? "bg-green-100 text-green-700" : inc.estado === "Pendiente Validación" ? "bg-orange-100 text-orange-800" : inc.estado === "Pendiente" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {inc.estado}
                        </span>
                        <h3 className="font-bold text-gray-800 text-sm mt-1.5">{inc.titulo}</h3>
                        <p className="text-xs text-gray-400">{inc.descripcion}</p>
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
              onClick={() => setIsScanning(true)}
              className="w-full max-w-sm py-4 rounded-2xl shadow-lg font-bold text-lg flex justify-center gap-2 bg-pm-ocre text-white"
            >
              <Camera size={24} /> {esLimpieza ? "ESCANEAR QR ZONA / REPASO" : "ESCANEAR QR AVISO"}
            </button>
          </div>
        </>
      )}

      {/* PESTAÑA GERENCIA */}
      {activeTab === "gerencia" && (
        <div className="bg-[#F8F9FA] min-h-screen pb-12">
          <header className="bg-[#204136] text-white shadow-lg sticky top-0 z-30 border-b-2 border-[#E3A82B]">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Parque Melilla" className="h-10 w-auto object-contain drop-shadow-sm" />
                <div className="border-l border-white/20 pl-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-extrabold tracking-wide uppercase">Parque Melilla Connect</h1>
                    <span className="bg-[#E3A82B] text-black text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">Gerencia</span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Centro de Control y Supervisión Operativa
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-black/25 rounded-xl p-1 gap-1 border border-white/10">
                  <button type="button" onClick={() => exportarCSV("incidencias")} className="bg-white/10 hover:bg-[#E3A82B] hover:text-black text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs">
                    <Download size={13} /> Avisos
                  </button>
                  <button type="button" onClick={() => exportarCSV("repasos")} className="bg-white/10 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs">
                    <Download size={13} /> Limpieza
                  </button>
                  <button type="button" onClick={() => exportarCSV("seguridad")} className="bg-white/10 hover:bg-gray-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs">
                    <Download size={13} /> Seguridad
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pl-2 border-l border-white/20">
                  <button type="button" onClick={cargarDatos} title="Actualizar datos" className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white">
                    <RefreshCw size={15} />
                  </button>
                  <button type="button" onClick={handleLogout} title="Cerrar sesión" className="bg-red-500/20 hover:bg-red-600 text-red-200 hover:text-white p-2 rounded-xl border border-red-400/30">
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {(() => {
              const total = incidenciasList.length;
              const resueltas = incidenciasList.filter((i) => i.estado === "Resuelta").length;
              const abiertas = incidenciasList.filter((i) => i.estado !== "Resuelta").length;
              const criticas = incidenciasList.filter((i) => i.prioridad?.includes("P1") && i.estado !== "Resuelta").length;
              const pctResolucion = total > 0 ? Math.round((resueltas / total) * 100) : 0;
              const repasosHoy = checklistHistorial.filter((c) => c.departamento === "Limpieza").length;

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-2xl border shadow-xs transition-all bg-white ${criticas > 0 ? "border-red-300 ring-2 ring-red-500/20" : "border-gray-200"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black tracking-wider uppercase text-gray-500 block">Alertas P1</span>
                        <p className="text-3xl font-black text-red-600 mt-1">{criticas}</p>
                      </div>
                      <div className={`p-2 rounded-xl ${criticas > 0 ? "bg-red-100 text-red-700 animate-pulse" : "bg-gray-100 text-gray-400"}`}>
                        <ShieldAlert size={20} />
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-gray-500 mt-3">
                      {criticas > 0 ? <span className="text-red-600 font-bold">● Requieren atención inmediata</span> : <span className="text-emerald-700 font-bold">✓ Sin bloqueos urgentes</span>}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black tracking-wider uppercase text-gray-500 block">En Curso</span>
                        <p className="text-3xl font-black text-[#E3A82B] mt-1">{abiertas}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><Clock size={20} /></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Pendientes de resolver</span>
                      <span className="font-mono font-bold text-gray-700">{total > 0 ? Math.round((abiertas / total) * 100) : 0}%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black tracking-wider uppercase text-gray-500 block">Eficacia Operativa</span>
                        <p className="text-3xl font-black text-emerald-700 mt-1">{resueltas}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle size={20} /></div>
                    </div>
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                        <span>Tasa de éxito</span>
                        <span className="text-emerald-700 font-mono">{pctResolucion}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pctResolucion}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black tracking-wider uppercase text-gray-500 block">Limpieza Hoy</span>
                        <p className="text-3xl font-black text-[#204136] mt-1">{repasosHoy}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-800"><Sparkles size={20} /></div>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-3">✓ Tareas certificadas en jornada</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="bg-gradient-to-r from-[#204136] to-emerald-900 p-3.5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg text-[#E3A82B]"><Shield size={16} /></div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Partes de Seguridad</h3>
                        <p className="text-[10px] text-gray-300">Libro de servicio diario 24h</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold">{partesSeguridadList.length}</span>
                  </div>
                  <div className="p-3 max-h-52 overflow-y-auto space-y-2 bg-gray-50/50">
                    {partesSeguridadList.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Sin partes registrados.</p>
                    ) : (
                      partesSeguridadList.map((parte) => (
                        <div key={parte.id} onClick={() => setParteAImprimir(parte)} className="flex justify-between items-center bg-white border border-gray-200 hover:border-[#E3A82B] p-2.5 rounded-xl cursor-pointer shadow-2xs hover:shadow-sm transition-all group">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-800">{new Date(parte.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${parte.estado === "Cerrado" ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                {parte.estado === "Cerrado" ? "Sellado" : "En Curso"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">Ref. SEC-{parte.fecha.replace(/-/g, "")}</span>
                          </div>
                          <button type="button" className="bg-gray-100 group-hover:bg-[#E3A82B] group-hover:text-black p-2 rounded-lg text-gray-600 transition-colors">
                            <Printer size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="bg-gradient-to-r from-red-900 to-rose-950 p-3.5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg text-[#E3A82B]"><FileWarning size={16} /></div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Atestados e Intervención</h3>
                        <p className="text-[10px] text-red-200">Incidentes graves con FFCCSE / 061</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold">{informesIntervencionList.length}</span>
                  </div>
                  <div className="p-3 max-h-52 overflow-y-auto space-y-2 bg-gray-50/50">
                    {informesIntervencionList.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Sin atestados extraordinarios.</p>
                    ) : (
                      informesIntervencionList.map((inf) => (
                        <div key={inf.id} onClick={() => setInformeAImprimir(inf)} className="flex justify-between items-center bg-white border border-gray-200 hover:border-red-400 p-2.5 rounded-xl cursor-pointer shadow-2xs hover:shadow-sm transition-all group">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-800">{inf.codigo_expediente}</span>
                              <span className="text-[9px] bg-red-50 text-red-700 font-bold px-1.5 py-0.2 rounded border border-red-200">{inf.tipologia}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 block mt-0.5">{new Date(inf.fecha).toLocaleDateString("es-ES")} • {inf.hora} h</span>
                          </div>
                          <button type="button" className="bg-gray-100 group-hover:bg-red-800 group-hover:text-white p-2 rounded-lg text-gray-600 transition-colors">
                            <Printer size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-3.5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg text-[#E3A82B]"><Sparkles size={16} /></div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Supervisión Limpieza</h3>
                        <p className="text-[10px] text-emerald-200">Certificaciones in situ de hoy</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 max-h-56 overflow-y-auto space-y-2 bg-gray-50/50">
                    {checklistHistorial.filter((c) => c.departamento === "Limpieza").length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Sin repasos certificados en la jornada.</p>
                    ) : (
                      checklistHistorial
                        .filter((c) => c.departamento === "Limpieza")
                        .map((c) => (
                          <div key={c.id} className="bg-white border border-gray-200 p-2.5 rounded-xl text-xs shadow-2xs">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-gray-800 text-xs">{c.zona}</span>
                              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                {new Date(c.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-1 leading-snug">{c.estado}</p>
                            <span className="text-[10px] text-gray-400 italic block mt-1">{c.operario}</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por título, zona o código..."
                        value={busquedaGerencia}
                        onChange={(e) => setBusquedaGerencia(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#204136] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
                      {["Todas", "Registrada", "Pendiente", "Resuelta"].map((est) => (
                        <button
                          type="button"
                          key={est}
                          onClick={() => setFiltroEstado(est)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                            filtroEstado === est ? "bg-[#204136] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {est}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100 text-[11px]">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mr-1 shrink-0">Área:</span>
                    {["Todos", "Mantenimiento", "Limpieza", "Seguridad", "General"].map((dep) => (
                      <button
                        type="button"
                        key={dep}
                        onClick={() => setFiltroDepartamentoGerencia(dep)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition-all shrink-0 ${
                          filtroDepartamentoGerencia === dep ? "bg-[#E3A82B] text-black border-[#E3A82B] shadow-2xs" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {dep === "General" ? "📣 General" : dep}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const filtradas = incidenciasList.filter((i) => {
                    const cumpleEstado = filtroEstado === "Todas" || i.estado === filtroEstado;
                    const cumpleDep = filtroDepartamentoGerencia === "Todos" || i.departamento_destino === filtroDepartamentoGerencia;
                    const texto = `${i.titulo} ${i.descripcion} ${i.codigo_ticket}`.toLowerCase();
                    const cumpleBusqueda = !busquedaGerencia.trim() || texto.includes(busquedaGerencia.toLowerCase());
                    return cumpleEstado && cumpleDep && cumpleBusqueda;
                  });

                  if (filtradas.length === 0) {
                    return (
                      <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                        <CheckCircle size={36} className="mx-auto text-emerald-600/40 mb-2" />
                        <h4 className="text-sm font-bold text-gray-700">Sin incidencias en esta vista</h4>
                        <p className="text-xs text-gray-400 mt-1">No hay tickets que coincidan con los filtros seleccionados.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filtradas.map((inc) => {
                        const noLeidos = Math.max(0, (inc.comentarios?.length || 0) - (mensajesLeidos[inc.id] || 0));
                        const esCritica = inc.prioridad?.includes("P1");

                        return (
                          <div
                            key={inc.id}
                            onClick={() => abrirFicha(inc)}
                            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden flex flex-col justify-between group ${
                              esCritica && inc.estado !== "Resuelta" ? "border-red-300 ring-1 ring-red-400" : "border-gray-200 hover:border-[#204136]"
                            }`}
                          >
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${
                              esCritica ? "bg-red-500" : inc.prioridad?.includes("P2") ? "bg-[#E3A82B]" : "bg-gray-300"
                            }`}></div>

                            <div>
                              <div className="flex justify-between items-start gap-2 pl-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[11px] font-black text-gray-500 tracking-wider">{inc.codigo_ticket}</span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${esCritica ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{inc.prioridad}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  inc.estado === "Resuelta" ? "bg-emerald-100 text-emerald-800" : inc.estado === "Pendiente Validación" ? "bg-orange-100 text-orange-800" : inc.estado === "Pendiente" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-900"
                                }`}>
                                  {inc.estado}
                                </span>
                              </div>

                              <div className="flex gap-3 pl-2 items-start mt-1">
                                {inc.foto_url && (
                                  <ImagenSegura ruta={inc.foto_url} alt="Evidencia" className="w-14 h-14 object-cover rounded-xl border border-gray-200 shrink-0 group-hover:opacity-90" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm text-gray-900 leading-snug group-hover:text-[#204136] transition-colors line-clamp-2">{inc.titulo}</h3>
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                    <MapPin size={12} className="text-[#E3A82B] shrink-0" />
                                    <span className="truncate">{inc.descripcion?.replace("Ubicación: ", "")}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex justify-between items-center pl-2 text-[11px] text-gray-400">
                              <span className="font-semibold text-gray-600 flex items-center gap-1">
                                {inc.departamento_destino === "General" ? <Bell size={13} className="text-[#E3A82B]" /> : <Users size={13} className="text-gray-400" />}
                                {inc.departamento_destino || "Mantenimiento"}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-gray-400">{new Date(inc.fecha_creacion).toLocaleDateString([], { day: "2-digit", month: "short" })}</span>
                                {noLeidos > 0 && (
                                  <span className="text-[10px] text-white font-bold bg-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <MessageSquare size={10} /> {noLeidos}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden mt-6">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-600" />
                  <h3 className="text-xs font-bold uppercase text-gray-800">Fichas de Personal y Accesos Activos</h3>
                </div>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">{directorioPersonal.length} Usuarios</span>
              </div>
              <div className="p-0 overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-bold uppercase">Nombre Completo</th>
                      <th className="px-4 py-2 font-bold uppercase">Usuario Acceso</th>
                      <th className="px-4 py-2 font-bold uppercase">Departamento</th>
                      <th className="px-4 py-2 font-bold uppercase">Alta en Sistema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {directorioPersonal.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-6 text-gray-400">Sin usuarios cargados en el directorio.</td></tr>
                    ) : (
                      directorioPersonal.map((emp) => {
                        const username = emp.email.replace("@parquemelilla.es", "");
                        return (
                          <tr key={emp.id} className="hover:bg-gray-50/80">
                            <td className="px-4 py-2.5 font-bold text-gray-800">{emp.nombre_completo || "Cuenta Genérica / Retén"}</td>
                            <td className="px-4 py-2.5 text-gray-500 font-mono text-[11px]">{username}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-1 rounded-[4px] text-[9px] font-black uppercase ${
                                emp.rol === "Seguridad" ? "bg-gray-800 text-white" : emp.rol === "Limpieza" ? "bg-emerald-100 text-emerald-800" : emp.rol === "Mantenimiento" ? "bg-amber-100 text-amber-900" : "bg-pm-verde text-white"
                              }`}>
                                {emp.rol}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-400">{emp.creado_en ? new Date(emp.creado_en).toLocaleDateString("es-ES") : "---"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUDITORÍA LIMPIEZA */}
      {showModalRepaso && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-3">
              <div>
                <h3 className="font-bold text-pm-verde text-sm flex items-center gap-1.5">
                  <Sparkles size={16} className="text-pm-ocre" /> Certificación de Repaso
                </h3>
                <p className="text-[11px] text-gray-500">Supervisión del servicio de limpieza</p>
              </div>
              <button type="button" onClick={() => setShowModalRepaso(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 text-[11px] text-amber-800 leading-tight">
              <strong>Plazo Operativo:</strong> Debes registrar y certificar esta tarea antes de las <strong>23:59 h</strong> del día de hoy.
            </div>
            <form onSubmit={guardarRegistroRepaso} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1 text-[10px]">Zona / Instalación Auditada *</label>
                <select value={repasoZona} onChange={(e) => setRepasoZona(e.target.value)} required className="w-full border rounded-lg p-2.5 outline-none focus:border-pm-verde font-semibold">
                  <option value="Aseos Galería P0">Aseos Galería P0</option>
                  <option value="Aseos Planta 1 (Restauración)">Aseos Planta 1 (Restauración)</option>
                  <option value="Aseos Parking">Aseos Parking</option>
                  <option value="Galería Comercial P0">Galería Comercial P0</option>
                  <option value="Plaza Central">Plaza Central</option>
                  <option value="Parking Subterráneo">Parking Subterráneo</option>
                  <option value="Pasillo Técnico">Pasillo Técnico</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-600 uppercase mb-1 text-[10px]">Hora de Realización *</label>
                  <input type="time" required value={repasoHora} onChange={(e) => setRepasoHora(e.target.value)} className="w-full border rounded-lg p-2.5 font-mono outline-none focus:border-pm-verde" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 uppercase mb-1 text-[10px]">Tipo de Trabajo *</label>
                  <select value={repasoTipo} onChange={(e) => setRepasoTipo(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none font-semibold focus:border-pm-verde">
                    <option value="Repaso de Aseos">Repaso de Aseos</option>
                    <option value="Limpieza a Fondo">Limpieza a Fondo</option>
                    <option value="Reposición Consumibles">Reposición Consumibles</option>
                    <option value="Mapeado / Fregado">Mapeado / Fregado</option>
                    <option value="Retirada de Residuos">Retirada de Residuos</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1 text-[10px]">Operario/a ejecutor/a *</label>
                <input type="text" required placeholder="Ej: Rachida / Cuadrilla Tarde" value={repasoOperario} onChange={(e) => setRepasoOperario(e.target.value)} className="w-full border rounded-lg p-2.5 text-xs outline-none focus:border-pm-verde" />
              </div>
              <div>
                <label className="block font-bold text-gray-600 uppercase mb-1 text-[10px]">Observaciones / Comprobaciones</label>
                <textarea placeholder="Ej: Jabón y papel repuestos, suelo seco..." value={repasoObservaciones} onChange={(e) => setRepasoObservaciones(e.target.value)} className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none focus:border-pm-verde"></textarea>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setShowModalRepaso(false)} className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="w-2/3 bg-pm-verde hover:bg-emerald-900 text-white font-bold py-3 rounded-xl shadow-md">
                  {isSubmitting ? "Certificando..." : "Certificar Trabajo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE INCIDENCIA */}
      {incidenciaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-3xl sm:rounded-t-3xl">
              <span className="text-xs font-bold text-gray-500">{incidenciaSeleccionada.codigo_ticket}</span>
              <button type="button" onClick={() => setIncidenciaSeleccionada(null)} className="bg-gray-200 text-gray-600 p-1.5 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {incidenciaSeleccionada.foto_url && (
                <ImagenSegura ruta={incidenciaSeleccionada.foto_url} alt="Avería" className="w-full h-48 object-cover rounded-xl mb-4" />
              )}
              <h2 className="text-lg font-bold text-gray-800 leading-tight mb-1">{incidenciaSeleccionada.titulo}</h2>
              <p className="text-sm text-gray-500 mb-4 flex gap-1"><MapPin size={14} className="text-pm-ocre" /> {incidenciaSeleccionada.descripcion}</p>

              {incidenciaSeleccionada.estado === "Pendiente" && (
                <div className="bg-purple-50 p-3 rounded-xl mb-4">
                  <p className="text-xs font-bold text-purple-800">Motivo Pausa:</p>
                  <p className="text-sm italic">"{incidenciaSeleccionada.motivo_pendiente}"</p>
                </div>
              )}
              {(incidenciaSeleccionada.estado === "Resuelta" || incidenciaSeleccionada.estado === "Pendiente Validación") && (
                <div className="bg-green-50 p-3 rounded-xl mb-4">
                  <p className="text-xs font-bold text-green-800">Trabajo Ejecutado:</p>
                  <p className="text-sm italic mb-2">"{incidenciaSeleccionada.observaciones_tecnico}"</p>
                  {incidenciaSeleccionada.foto_resolucion_url && (
                    <ImagenSegura ruta={incidenciaSeleccionada.foto_resolucion_url} alt="Resolución" className="w-full h-40 object-cover rounded-lg" />
                  )}
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 mb-3">Chat del Aviso</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                  {chatMessages.map((msg) => {
                    const esMio = msg.autor === (userProfile?.nombre_completo || userProfile?.email);
                    return (
                      <div key={msg.id} className={`flex flex-col ${esMio ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] text-gray-400 font-bold mx-1">{msg.autor}</span>
                        <div className={`p-2.5 rounded-2xl text-sm max-w-[85%] ${esMio ? "bg-pm-verde text-white rounded-tr-none" : "bg-white border rounded-tl-none"}`}>
                          {msg.mensaje}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>
                <form onSubmit={enviarMensaje} className="flex gap-2">
                  <input type="text" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} disabled={enviandoMensaje} className="flex-1 border rounded-full px-4 text-sm outline-none focus:border-pm-verde" placeholder="Escribe..." />
                  <button type="submit" disabled={!nuevoMensaje.trim()} className="bg-pm-ocre text-white p-2.5 rounded-full"><Send size={16} /></button>
                </form>
              </div>

              {incidenciaSeleccionada.estado !== "Resuelta" && (
                <div className="mt-6 border-t pt-4">
                  {incidenciaSeleccionada.estado === "Pendiente Validación" && esGerente ? (
                    !accionActiva ? (
                      <div className="flex gap-2">
                        <button onClick={(e) => ejecutarAccionTicket("Resuelta", e)} className="w-1/2 bg-pm-verde text-white font-bold py-3 rounded-xl"><CheckCircle size={16} className="inline mr-1" /> APROBAR Y CERRAR</button>
                        <button onClick={() => setAccionActiva("rechazar")} className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl"><X size={16} className="inline mr-1" /> RECHAZAR TRABAJO</button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => ejecutarAccionTicket("Rechazada", e)} className="bg-red-50 p-4 rounded-xl space-y-4">
                        <p className="text-xs font-bold text-red-800">Indica por qué rechazas la reparación:</p>
                        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej: Faltan remates..." className="w-full border rounded-lg p-2 text-sm" required></textarea>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setAccionActiva(null)} className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm">Atrás</button>
                          <button type="submit" className="w-2/3 bg-red-600 text-white font-bold py-3 rounded-lg">Devolver Avería</button>
                        </div>
                      </form>
                    )
                  ) : !accionActiva && incidenciaSeleccionada.estado !== "Pendiente Validación" ? (
                    <div className="flex gap-2">
                      <button onClick={() => setAccionActiva("resolver")} className="w-1/2 bg-pm-verde text-white font-bold py-3 rounded-xl"><CheckCircle size={16} className="inline mr-1" /> {esGerente ? "RESOLVER" : "FINALIZAR TRABAJO"}</button>
                      {incidenciaSeleccionada.estado !== "Pendiente" && (
                        <button onClick={() => setAccionActiva("pendiente")} className="w-1/2 bg-purple-600 text-white font-bold py-3 rounded-xl"><Clock size={16} className="inline mr-1" /> PAUSAR</button>
                      )}
                    </div>
                  ) : accionActiva === "resolver" ? (
                    <form onSubmit={(e) => ejecutarAccionTicket(esGerente ? "Resuelta" : "Pendiente Validación", e)} className="bg-gray-50 p-4 rounded-xl space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Foto del Trabajo Finalizado *</label>
                        {fotoDespuesPreview ? (
                          <div className="relative mb-2">
                            <img src={fotoDespuesPreview} className="h-32 w-full object-cover rounded-xl border border-gray-200" alt="Resuelto" />
                            <button type="button" onClick={() => { setFotoDespuesFile(null); setFotoDespuesPreview(null); }} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow"><X size={16} /></button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <button type="button" onClick={() => camaraResueltoRef.current?.click()} className="border-2 border-dashed border-green-600 bg-green-50/50 hover:bg-green-50 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer text-center shadow-sm">
                              <Camera className="text-green-700 mb-1" size={24} />
                              <span className="text-xs font-bold text-green-800">Hacer Foto</span>
                            </button>
                            <button type="button" onClick={() => galeriaResueltoRef.current?.click()} className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer text-center shadow-sm">
                              <Upload className="text-gray-400 mb-1" size={24} />
                              <span className="text-xs font-bold text-gray-700">Galería</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Detalla el trabajo realizado..." className="w-full border rounded-lg p-2 text-sm outline-none focus:border-pm-verde" required></textarea>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setAccionActiva(null)} className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm">Atrás</button>
                        <button type="submit" className="w-2/3 bg-pm-verde text-white font-bold py-3 rounded-lg">{esGerente ? "Marcar Resuelto" : "Solicitar Validación"}</button>
                      </div>
                    </form>
                  ) : accionActiva === "pendiente" ? (
                    <form onSubmit={(e) => ejecutarAccionTicket("Pendiente", e)} className="bg-purple-50 p-4 rounded-xl space-y-4">
                      <textarea value={motivoPendiente} onChange={(e) => setMotivoPendiente(e.target.value)} placeholder="Motivo de la pausa..." className="w-full border rounded-lg p-2 text-sm outline-none focus:border-purple-600" required></textarea>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setAccionActiva(null)} className="w-1/3 bg-gray-200 font-bold rounded-lg text-sm">Atrás</button>
                        <button type="submit" className="w-2/3 bg-purple-600 text-white font-bold py-3 rounded-lg">Pausar</button>
                      </div>
                    </form>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFORME EXTRAORDINARIO */}
      {showInformeExtr && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[95vh] h-full sm:h-auto overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-red-900 text-white sm:rounded-t-3xl">
              <div className="flex gap-2">
                <FileWarning size={18} className="text-[#E3A82B]" />
                <span className="font-bold text-sm">Redactar Informe de Intervención</span>
              </div>
              <button type="button" onClick={() => setShowInformeExtr(false)} className="text-gray-300 hover:text-white p-1"><X size={20} /></button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto bg-gray-50 space-y-5">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">1. Localización y Tipología</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hora Incidente *</label>
                    <input type="time" value={informeHora} onChange={(e) => setInformeHora(e.target.value)} className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipología *</label>
                    <select value={datosInforme.tipologia} onChange={(e) => setDatosInforme({ ...datosInforme, tipologia: e.target.value })} className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900">
                      <option>Hurto / Robo</option>
                      <option>Altercado / Agresión</option>
                      <option>Intervención Policial</option>
                      <option>Emergencia Médica / 061</option>
                      <option>Daños Materiales / Vandalismo</option>
                      <option>Desalojo / Otros</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lugar exacto (Local, Pasillo...) *</label>
                    <input type="text" value={datosInforme.ubicacion_exacta} onChange={(e) => setDatosInforme({ ...datosInforme, ubicacion_exacta: e.target.value })} placeholder="Ej: Puerta local Zara P1" className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">2. Intervención Policial</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cuerpo Interviniente</label>
                    <select value={datosInforme.cuerpo_seguridad} onChange={(e) => setDatosInforme({ ...datosInforme, cuerpo_seguridad: e.target.value })} className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900">
                      <option>Cuerpo Nacional de Policía (CNP)</option>
                      <option>Policía Local</option>
                      <option>Guardia Civil</option>
                      <option>061 / Asistencia Sanitaria</option>
                      <option>Sin intervención de FFCCSE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Indicativo / Dotación</label>
                    <input type="text" value={datosInforme.dotacion_policial} onChange={(e) => setDatosInforme({ ...datosInforme, dotacion_policial: e.target.value })} placeholder="Ej: Z-14" className="w-full border rounded-lg p-2 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nº Placas Agentes</label>
                    <input type="text" value={datosInforme.numero_agentes} onChange={(e) => setDatosInforme({ ...datosInforme, numero_agentes: e.target.value })} placeholder="Ej: 104230" className="w-full border rounded-lg p-2 text-xs outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nº Atestado / Diligencias (Opcional)</label>
                    <input type="text" value={datosInforme.numero_atestado} onChange={(e) => setDatosInforme({ ...datosInforme, numero_atestado: e.target.value })} placeholder="Referencia si la hubiese" className="w-full border rounded-lg p-2 text-xs outline-none" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">3. Relato Circunstanciado *</h3>
                <div className="relative">
                  <textarea value={datosInforme.descripcion_detallada} onChange={(e) => setDatosInforme({ ...datosInforme, descripcion_detallada: e.target.value })} placeholder="Narra los hechos cronológicamente..." className="w-full border rounded-lg p-3 pr-10 text-xs min-h-[120px] outline-none focus:border-red-900"></textarea>
                  <button type="button" onClick={alternarDictadoInforme} className={`absolute right-2 bottom-2 p-2 rounded-full ${isListeningInforme ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500"}`}><Mic size={16} /></button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 mt-2">Personas Implicadas / Testigos</label>
                  <textarea value={datosInforme.personas_implicadas} onChange={(e) => setDatosInforme({ ...datosInforme, personas_implicadas: e.target.value })} placeholder="Identificaciones si procede..." className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none"></textarea>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2">4. Cámaras CCTV y Efectos</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cámaras Acotadas</label>
                    <textarea value={datosInforme.camaras_cctv} onChange={(e) => setDatosInforme({ ...datosInforme, camaras_cctv: e.target.value })} placeholder="Ej: Cam-04 Pasillo" className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Efectos o Daños</label>
                    <textarea value={datosInforme.efectos_danos} onChange={(e) => setDatosInforme({ ...datosInforme, efectos_danos: e.target.value })} placeholder="Mercancía, roturas..." className="w-full border rounded-lg p-2 text-xs min-h-[50px] outline-none"></textarea>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-800 uppercase border-b pb-2 mb-3">5. Vigilante Redactor</h3>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Número de TIP *</label>
                <input type="text" value={datosInforme.vigilante_tip} onChange={(e) => setDatosInforme({ ...datosInforme, vigilante_tip: e.target.value })} className="w-full border rounded-lg p-2 text-xs outline-none focus:border-red-900" placeholder="Obligatorio para la firma" />
              </div>
            </div>
            <div className="p-4 bg-white border-t">
              <button type="button" onClick={iniciarFirmaInforme} className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-md flex justify-center items-center gap-2">
                <PenTool size={18} /> VALIDAR Y FIRMAR INFORME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARTE DE SEGURIDAD 24H (EDICIÓN Y LLENADO) */}
      {showParteSeguridad && !parteAImprimir && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[95vh] h-full sm:h-auto">
            <div className="p-4 border-b flex justify-between items-center bg-gray-800 text-white rounded-t-3xl sm:rounded-t-3xl">
              <div>
                <div className="flex gap-2">
                  <Shield className="text-pm-ocre" size={18} />
                  <span className="font-bold text-sm">CDAD PROP PARQUE MELILLA</span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono mt-0.5">Fecha: {parteFecha}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${parteEstado === "Cerrado" ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
                  {parteEstado.toUpperCase()}
                </span>
                <button type="button" onClick={() => setShowParteSeguridad(false)} className="text-gray-300 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-gray-50 space-y-4">
              <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl">
                {["Mañana", "Tarde", "Noche"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setPestañaTurnoVer(t)}
                    className={`py-2 text-xs font-bold rounded-lg relative ${
                      pestañaTurnoVer === t ? "bg-gray-800 text-white shadow-md" : "text-gray-600"
                    }`}
                  >
                    {t} {turnoEnCurso === t && <span className="block text-[8px] text-pm-ocre uppercase">En Curso</span>}
                  </button>
                ))}
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700 uppercase">Vigilante Turno {pestañaTurnoVer}</span>
                  {!puedeEditarTurno(pestañaTurnoVer) && <span className="text-[10px] text-gray-400 italic">Solo lectura</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      value={datosTurnos[pestañaTurnoVer]?.vigilante_nombre || ""}
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
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nº TIP</label>
                    <input
                      type="text"
                      value={datosTurnos[pestañaTurnoVer]?.vigilante_tip || ""}
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
                  <ClipboardList size={14} className="text-pm-ocre" /> Novedades {pestañaTurnoVer}
                </h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {(!datosTurnos[pestañaTurnoVer]?.novedades || datosTurnos[pestañaTurnoVer].novedades.length === 0) ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Sin novedades.</p>
                  ) : (
                    datosTurnos[pestañaTurnoVer].novedades.map((ent) => (
                      <div
                        key={ent.id}
                        className={`p-2.5 rounded-lg border flex gap-2.5 relative pr-7 text-xs ${
                          (ent.texto || "").includes("🔴 Intervención") ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <span className={`font-bold px-1.5 py-0.5 rounded border ${(ent.texto || "").includes("🔴 Intervención") ? "bg-red-100 text-red-800 border-red-300" : "bg-white text-gray-700"}`}>
                          {ent.hora}
                        </span>
                        <p className={`flex-1 ${(ent.texto || "").includes("🔴 Intervención") ? "text-red-900 font-semibold" : "text-gray-800"}`}>
                          {ent.texto}
                        </p>
                        {puedeEditarTurno(pestañaTurnoVer) && (
                          <button type="button" onClick={() => eliminarNovedadTurno(ent.id)} className="absolute right-2 top-2 text-red-400">
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
                      <input type="time" value={nuevaEntradaHora} onChange={(e) => setNuevaEntradaHora(e.target.value)} className="border rounded-lg px-2 text-xs w-24" />
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
                          className={`absolute right-1.5 bottom-2 p-1.5 rounded-full ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500"}`}
                        >
                          <Mic size={15} />
                        </button>
                      </div>
                    </div>
                    <button type="button" onClick={agregarNovedadTurno} className="w-full bg-gray-100 text-gray-800 font-bold text-xs py-2 rounded-lg flex justify-center gap-1 border">
                      <Plus size={14} /> Añadir Novedad
                    </button>
                  </div>
                )}
              </div>

              {pestañaTurnoVer === "Noche" && (
                <div className="bg-white p-4 rounded-xl border shadow-sm mt-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 flex gap-1.5">
                    <Shield size={14} className="text-pm-ocre" /> Dotación Común (Cierre)
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Walkie Talkies</label>
                      <input
                        type="number"
                        value={inventario.walkies}
                        onChange={(e) => setInventario({ ...inventario, walkies: e.target.value })}
                        disabled={!puedeEditarTurno(pestañaTurnoVer)}
                        className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Linternas</label>
                      <input
                        type="number"
                        value={inventario.linternas}
                        onChange={(e) => setInventario({ ...inventario, linternas: e.target.value })}
                        disabled={!puedeEditarTurno(pestañaTurnoVer)}
                        className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Móvil Servicio</label>
                      <input
                        type="number"
                        value={inventario.moviles}
                        onChange={(e) => setInventario({ ...inventario, moviles: e.target.value })}
                        disabled={!puedeEditarTurno(pestañaTurnoVer)}
                        className="w-full border rounded-lg p-2 text-xs disabled:bg-gray-50"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 border rounded-lg p-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inventario.llaves_maestras}
                          onChange={(e) => setInventario({ ...inventario, llaves_maestras: e.target.checked })}
                          disabled={!puedeEditarTurno(pestañaTurnoVer)}
                          className="w-4 h-4 text-pm-verde"
                        />
                        Juego Llaves Maestro
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Observaciones Material</label>
                    <textarea
                      value={inventario.observaciones_material}
                      onChange={(e) => setInventario({ ...inventario, observaciones_material: e.target.value })}
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
                    <Save size={16} /> {isSubmitting ? "Guardando..." : `Guardar Borrador (${pestañaTurnoVer})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => iniciarCierreTurno(pestañaTurnoVer)}
                    disabled={isSubmitting}
                    className={`w-full font-bold py-3 rounded-xl text-sm flex justify-center gap-1.5 shadow-sm ${
                      pestañaTurnoVer === "Noche" ? "border border-red-300 bg-red-50 text-red-700" : "bg-gray-800 text-white"
                    }`}
                  >
                    <PenTool size={16} /> {pestañaTurnoVer === "Noche" ? "Firmar y Sellar Parte Completo" : `Firmar y Cerrar (${pestañaTurnoVer})`}
                  </button>
                </>
              )}
              {parteEstado !== "Cerrado" && datosTurnos[pestañaTurnoVer]?.cerrado && (
                <div className="bg-green-50 text-green-700 text-center py-2.5 rounded-xl text-xs font-bold flex justify-center gap-1.5 border border-green-200">
                  <CheckCircle size={14} /> Turno de {pestañaTurnoVer} firmado y cerrado
                </div>
              )}
              {parteEstado === "Cerrado" && (
                <div className="bg-gray-100 text-gray-500 text-center py-2.5 rounded-xl text-xs font-bold flex justify-center gap-1.5 border">
                  <CandadoIcon size={14} /> Este parte de 24 horas ha sido sellado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR AVISO */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-pm-verde">Reportar Aviso</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitCreacion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Dirigido a *</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Mantenimiento", "Limpieza", "Seguridad", "General"].map((dep) => (
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
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ubicación / Zona *</label>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-pm-ocre" />
                  <select
                    value={zonaNombre}
                    onChange={(e) => setZonaNombre(e.target.value)}
                    required
                    className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none"
                  >
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
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Foto Previa {departamentoDestino === "General" && <span className="normal-case font-normal text-gray-400">(Opcional)</span>}
                </label>
                {fotoPreview ? (
                  <div className="relative mb-2">
                    <img src={fotoPreview} className="h-36 w-full object-cover rounded-xl border border-gray-200 shadow-sm" alt="Vista previa" />
                    <button
                      type="button"
                      onClick={() => { setFotoFile(null); setFotoPreview(null); }}
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
                      <span className="text-xs font-bold text-[#204136]">Hacer Foto</span>
                      <span className="text-[10px] text-gray-400">Cámara directa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galeriaAvisoRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition text-center shadow-sm"
                    >
                      <Upload className="text-gray-400 mb-1" size={24} />
                      <span className="text-xs font-bold text-gray-700">Galería</span>
                      <span className="text-[10px] text-gray-400">Elegir archivo</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Título del Aviso *</label>
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

      {/* MODAL ESCANEO QR */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-4 bg-pm-verde flex justify-between items-center">
            <h2 className="text-white font-bold">{esLimpieza ? "Escanear QR de Zona para Certificar Repaso" : "Escanear QR"}</h2>
            <button type="button" onClick={() => setIsScanning(false)} className="bg-red-500 text-white p-1 rounded-full">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 w-full flex items-center justify-center relative">
            <Scanner onScan={(r) => handleScan(r[0].rawValue)} formats={["qr_code"]} />
            <div className="absolute border-2 border-pm-ocre w-64 h-64 rounded-xl opacity-60"></div>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN MÓVIL GERENCIA */}
      {esGerente && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around pb-safe z-40 h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("operario")}
            className={`flex flex-col items-center justify-center w-full ${activeTab === "operario" ? "text-pm-ocre" : "text-gray-400"}`}
          >
            <ClipboardList size={24} />
            <span className="text-[10px] font-bold">Operativa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gerencia")}
            className={`flex flex-col items-center justify-center w-full ${activeTab === "gerencia" ? "text-pm-ocre" : "text-gray-400"}`}
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