import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { B as Button, c as cn } from "./button-DjOZMqFS.mjs";
import { L as Label, I as Input } from "./label-BJaHSwYl.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { s as supabase } from "./client-BME84eyn.mjs";
import { u as useAuth } from "./use-auth-C2Kl6jq7.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as Sparkles, h as CircleAlert, m as EyeOff, E as Eye } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Alert = reactExports.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, role: "alert", className: cn(alertVariants({ variant }), className), ...props }));
Alert.displayName = "Alert";
const AlertTitle = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "h5",
    {
      ref,
      className: cn("mb-1 font-medium leading-none tracking-tight", className),
      ...props
    }
  )
);
AlertTitle.displayName = "AlertTitle";
const AlertDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props }));
AlertDescription.displayName = "AlertDescription";
function AuthPage() {
  const [mode, setMode] = reactExports.useState("login");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [fullName, setFullName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const [loading, setLoading] = reactExports.useState(false);
  const [verificationRequired, setVerificationRequired] = reactExports.useState(false);
  const [errorMessage, setErrorMessage] = reactExports.useState(null);
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (user) {
      navigate({
        to: "/dashboard"
      });
    }
  }, [user, navigate]);
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setVerificationRequired(false);
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem. Digite a mesma senha nos dois campos.");
        }
        if (password.length < 6) {
          throw new Error("A senha precisa ter no mínimo 6 caracteres.");
        }
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone
            },
            emailRedirectTo: window.location.origin + "/dashboard"
          }
        });
        if (error) throw error;
        setVerificationRequired(true);
        toast.success("Conta criada! Verifique seu e-mail para ativar.", {
          duration: 6e3
        });
        setPassword("");
        setConfirmPassword("");
      } else {
        const {
          data,
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          if (error.message.toLowerCase().includes("confirm") || error.status === 400 && error.message.toLowerCase().includes("verified")) {
            setVerificationRequired(true);
            throw new Error("E-mail não verificado. Você precisa confirmar seu e-mail antes de fazer login.");
          }
          throw error;
        }
        toast.success("Login realizado com sucesso!");
        navigate({
          to: "/dashboard"
        });
      }
    } catch (err) {
      console.error("Auth error:", err);
      setErrorMessage(err.message ?? "Ocorreu um erro ao processar sua solicitação.");
      toast.error(err.message ?? "Erro na autenticação.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen grid lg:grid-cols-2 bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden lg:block relative overflow-hidden bg-gradient-brand", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-background/30 backdrop-blur-[2px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-full flex flex-col justify-between p-12 text-primary-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 max-w-max", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-background/95 grid place-items-center shadow-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4.5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-xl font-bold tracking-tight text-foreground", children: "Reelary" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs mb-6 backdrop-blur-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-3 text-accent" }),
            " Agendamento Automatizado"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-4xl lg:text-5xl font-bold leading-tight max-w-lg mb-4", children: "Agende seus Reels e multiplique seu alcance no automático." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm opacity-90 max-w-md", children: '"Agendo todo o conteúdo do mês em minutos. Reelary mudou completamente a forma como gerencio minhas marcas parceiras!"' }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-xs opacity-75", children: "— Diretor de Social Media, +500k seguidores" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs opacity-60", children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " Reelary. Todos os direitos reservados."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-6 md:p-12 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center lg:text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "lg:hidden flex items-center justify-center gap-2 mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4.5 text-primary-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-xl font-bold", children: "Reelary" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold tracking-tight", children: mode === "login" ? "Entrar na sua conta" : "Comece grátis agora" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: mode === "login" ? "Insira suas credenciais para gerenciar seus agendamentos" : "Crie seu perfil em segundos e agende seu primeiro Reel" })
      ] }),
      verificationRequired && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { className: "border-warning/30 bg-warning/10 text-foreground animate-in fade-in slide-in-from-top-4 duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-5 text-warning shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTitle, { className: "font-bold text-warning text-sm md:text-base flex items-center gap-1.5", children: "⚠️ CONFIRMAÇÃO DE E-MAIL REQUERIDA!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDescription, { className: "text-xs md:text-sm mt-1 leading-relaxed text-muted-foreground", children: [
            "Enviamos um link de confirmação para o endereço ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: email }),
            ". Você ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "underline font-semibold text-foreground", children: "deve confirmar o e-mail" }),
            " acessando o link na sua caixa de entrada (ou pasta de spam) para conseguir entrar no Reelary."
          ] })
        ] })
      ] }),
      errorMessage && !verificationRequired && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", className: "animate-in fade-in duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTitle, { children: "Erro na autenticação" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { className: "text-xs", children: errorMessage })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fullName", children: "Nome Completo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "fullName", type: "text", required: true, value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "Seu nome completo", className: "h-10" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "phone", children: "Número de WhatsApp" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "phone", type: "tel", required: true, value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "(DD) 99999-9999", className: "h-10" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", children: "Endereço de E-mail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "voce@exemplo.com", className: "h-10" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password", children: "Senha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password", type: showPassword ? "text" : "password", required: true, minLength: 6, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "••••••••", className: "h-10 pr-10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition", children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "size-4" }) })
          ] })
        ] }),
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "confirmPassword", children: "Confirmar Senha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "confirmPassword", type: showPassword ? "text" : "password", required: true, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "••••••••", className: "h-10 pr-10" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading, className: "w-full bg-gradient-brand text-primary-foreground border-0 hover:opacity-95 font-semibold h-11 transition shadow-glow", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2 justify-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" }),
          "Carregando..."
        ] }) : mode === "login" ? "Entrar" : "Cadastrar-se & Confirmar E-mail" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground text-center pt-2", children: [
        mode === "login" ? "Ainda não tem uma conta? " : "Já tem cadastro? ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          setMode(mode === "login" ? "signup" : "login");
          setErrorMessage(null);
          setVerificationRequired(false);
        }, className: "text-primary hover:underline font-semibold cursor-pointer", children: mode === "login" ? "Cadastre-se grátis" : "Faça Login" })
      ] })
    ] }) })
  ] });
}
export {
  AuthPage as component
};
