export default function PageHeader({ title, breadcrumbs = [], actions = null }) {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between page-breadcrumb mb-3 gap-3">
      <div className="my-auto mb-2">
        <h2 className="mb-1">{title}</h2>
        <nav>
          <ol className="breadcrumb mb-0">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li
                  key={`${item.label}-${index}`}
                  className={`breadcrumb-item${isLast ? " active" : ""}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.href ? (
                    <a href={item.href}>
                      {item.iconClass ? <i className={item.iconClass} /> : item.label}
                    </a>
                  ) : (
                    item.label
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      <div className="d-flex my-xl-auto right-content align-items-center flex-wrap justify-content-end ms-md-auto">
        {actions}
      </div>
    </div>
  );
}
