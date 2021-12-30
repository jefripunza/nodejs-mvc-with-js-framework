exports.index = (req, res) => {
  res.send("api/index");
};

exports.contact = (req, res) => {
  res.send("api/contact");
};

exports.about = (req, res) => {
  res.send("api/about");
};

exports.csrf = (req, res) => {
  // pass the csrfToken to the view
  res.json({ csrfToken: req.csrfToken() });
};
