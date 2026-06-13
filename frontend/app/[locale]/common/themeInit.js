const themeColorLight = "#b8e6fe";
const themeColorDark = "#20100a";

window.fnGetCurrentTheme = () => {
  const theme = localStorage.getItem("theme");
  return theme === "dark" || theme === "light" ? theme : null;
};
window.fnCurrentThemeIsDark = () => {
  switch (window.fnGetCurrentTheme()) {
    case "dark":
      return true;
    case "light":
      return false;
    default:
      return (
        window?.matchMedia("(prefers-color-scheme: dark)").matches || false
      );
  }
};
window.fnApplyTheme = () => {
  document.body.classList.add("fn-csr-ready");
  if (window.fnCurrentThemeIsDark()) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  const metaThemeColor = document.querySelectorAll("meta[name=theme-color]");
  switch (window.fnGetCurrentTheme()) {
    case "dark":
      metaThemeColor.forEach((e) => {
        e.setAttribute("content", themeColorDark);
      });
      break;
    case "light":
      metaThemeColor.forEach((e) => {
        e.setAttribute("content", themeColorLight);
      });
      break;
    default:
      metaThemeColor[0].setAttribute("content", themeColorLight);
      metaThemeColor[1].setAttribute("content", themeColorDark);
      break;
  }
};

window.fnApplyTheme();
