import { NavLink } from "react-router-dom";

export const BottomNav = ({ filteredSidebarData }: any) => {
  // Create a derived flat array of items for bottom nav display
  const filteredItems = filteredSidebarData
    .filter(
      (item: any) =>
        item.type === "link" ||
        (item.type === "collapsible" &&
          item.children &&
          item.children.length > 0)
    )
    .map((item: any) => {
      // For collapsible items
      if (item.type === "collapsible") {
        const isException =
          item.title === "Reports" ||
          item.title === "Settings" ||
          item.title === "Assignments";

        const linkItem = isException
          ? item
          : {
              ...item,
              path: item.children[0]?.path,
              icon: item.children[0]?.icon || item.icon,
              title: item.children[0]?.title || item.title,
            };

        return linkItem;
      }

      // For regular link items
      return item;
    });

  const isFewItems = filteredItems.length <= 4;

  return (
    <div className={`bottom-nav-scroll ${isFewItems ? "centered" : ""}`}>
      {filteredItems.map((item: any) => (
        <NavLink
          key={item.path || item.title}
          to={item.path || "#"}
          className="bottom-option"
        >
          <item.icon />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </div>
  );
};
