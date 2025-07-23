#[dojo::model]
#[derive(Copy, Drop, Serde)]
pub struct ScoreObjective {
    #[key]
    pub id: u32,
    pub score: u32,
    pub exists: bool,
}

#[dojo::model]
#[derive(Copy, Drop, Serde)]
pub struct ScoreObjectiveCount {
    #[key]
    pub key: felt252,
    pub count: u32,
}
