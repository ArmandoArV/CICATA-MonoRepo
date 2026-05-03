import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGraduate,
  faChalkboardTeacher,
  faFileAlt,
  faChartLine,
  faShieldAlt,
  faArrowRight,
  faFlask,
  faUsers,
  faBook,
} from "@fortawesome/free-solid-svg-icons";

const features = [
  {
    icon: faUserGraduate,
    title: "Gestión de Estudiantes",
    description:
      "Registro, seguimiento y reinscripción de alumnos de maestría y doctorado con control de ciclos escolares.",
  },
  {
    icon: faChalkboardTeacher,
    title: "Gestión de Profesores",
    description:
      "Directorio académico con número de empleado, programa asignado y vinculación a grupos de estudio.",
  },
  {
    icon: faFileAlt,
    title: "Documentos Oficiales",
    description:
      "Generación automatizada de constancias, cartas de aceptación y documentos con folio secuencial y membretado institucional.",
  },
  {
    icon: faUsers,
    title: "Grupos de Estudio",
    description:
      "Administración de grupos por materia, ciclo escolar y profesores titulares y visitantes.",
  },
  {
    icon: faChartLine,
    title: "Dashboard Analítico",
    description:
      "Estadísticas en tiempo real de estudiantes, profesores, grupos activos y documentos generados.",
  },
  {
    icon: faShieldAlt,
    title: "Seguridad Institucional",
    description:
      "Autenticación JWT con tokens Bearer y cookies httpOnly. Control de acceso exclusivo para administradores.",
  },
];

const stats = [
  { label: "Tipos de Constancia", value: "4" },
  { label: "Tablas en BD", value: "18" },
  { label: "Endpoints API", value: "30+" },
  { label: "Plantillas PDF", value: "4" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Top institutional bar ── */}
      <div className="bg-[#6B002E] px-4 py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo-poli.png"
              alt="IPN"
              width={32}
              height={32}
              className="brightness-0 invert"
            />
            <span className="text-xs font-medium text-white/90 hidden sm:inline">
              Instituto Politécnico Nacional
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Image
              src="/images/educacion-logo.png"
              alt="Secretaría de Educación"
              width={100}
              height={24}
              className="brightness-0 invert opacity-80"
            />
          </div>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7A154A] via-[#6B002E] to-[#4a0020]">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-white/3" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left column — text */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <FontAwesomeIcon icon={faFlask} className="h-3 w-3 text-amber-300" />
                <span className="text-xs font-medium text-white/90">
                  CICATA Unidad Morelos
                </span>
              </div>

              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Gestión Académica
                <span className="mt-2 block text-amber-200/90">CICATA — IPN</span>
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-white/80">
                Plataforma integral para la administración de estudiantes, profesores,
                grupos de estudio y generación automatizada de documentos oficiales del
                Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#7A154A] shadow-lg shadow-black/20 transition-all hover:bg-amber-50 hover:shadow-xl"
                >
                  Iniciar Sesión
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10"
                >
                  Ver Dashboard
                </Link>
              </div>
            </div>

            {/* Right column — logo + card */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-white/5 backdrop-blur-sm" />
                <div className="relative rounded-2xl border border-white/10 bg-white/10 p-10 backdrop-blur-md">
                  <Image
                    src="/images/logo-header.png"
                    alt="CICATA IPN"
                    width={400}
                    height={80}
                    className="brightness-0 invert"
                    priority
                  />
                  <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
                    <Image
                      src="/images/top-right.png"
                      alt="Escudo IPN"
                      width={50}
                      height={50}
                      className="brightness-0 invert opacity-70"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white/90">Unidad Morelos</p>
                      <p className="text-xs text-white/60">
                        Maestría y Doctorado en Tecnología Avanzada
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-8 text-center">
              <p className="text-3xl font-extrabold text-[#7A154A]">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7A154A]/10 px-4 py-1.5">
              <FontAwesomeIcon icon={faBook} className="h-3 w-3 text-[#7A154A]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A154A]">
                Funcionalidades
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que necesitas para la gestión académica
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Una plataforma completa diseñada para las necesidades específicas del CICATA — IPN.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-[#7A154A]/20 hover:shadow-lg"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#7A154A]/5 transition-transform group-hover:scale-150" />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A154A]/10">
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className="h-5 w-5 text-[#7A154A]"
                    />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-gradient-to-r from-[#7A154A] to-[#6B002E] py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            ¿Listo para comenzar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Accede al sistema de gestión académica del CICATA — IPN y administra
            estudiantes, profesores y documentos oficiales en un solo lugar.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#7A154A] shadow-lg shadow-black/20 transition-all hover:bg-amber-50 hover:shadow-xl"
          >
            Acceder al Sistema
            <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/logo-header.png"
                alt="CICATA IPN"
                width={200}
                height={40}
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm font-medium text-gray-600">
                Centro de Investigación en Ciencia Aplicada y Tecnología Avanzada
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Boulevard de la Tecnología 1036, Atlacholoaya, C.P. 62790, Xochitepec, Morelos
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Tel: 777 308 61 01 · www.cicatamorelos.ipn.mx
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Instituto Politécnico Nacional · MiCicata — Sistema de Gestión Académica
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
