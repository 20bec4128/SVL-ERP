const footerHtml = `<div class="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
	<p class="mb-0">2025 &copy; SVL.</p>
	<p>Designed &amp; Developed By <a href="javascript:void(0);" class="text-primary">Nexor CRM</a></p>
</div>`;

export default function Footer() {
  return <div dangerouslySetInnerHTML={{ __html: footerHtml }} />;
}