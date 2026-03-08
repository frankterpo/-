const trigger = document.getElementById("am-trigger");
const menu = document.getElementById("am-menu");

if (trigger && menu) {
  const setOpen = (open) => {
    menu.classList.toggle("open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  };

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(!menu.classList.contains("open"));
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}
