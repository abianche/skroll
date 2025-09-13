/// Serializable view of the current node.
#[derive(serde::Serialize)]
pub struct NodeView {
    pub id: String,
    pub text: String,
    pub end: bool,
}
