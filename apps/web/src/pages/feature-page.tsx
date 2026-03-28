import { Chip, Paper, Stack, Typography } from "@mui/material";

type FeaturePageProps = {
  title: string;
  summary: string;
  nextStep: string;
};

export function FeaturePage({ title, summary, nextStep }: FeaturePageProps) {
  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={2}>
        <Chip label="Planned Surface" color="secondary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h4">{title}</Typography>
        <Typography color="text.secondary">{summary}</Typography>
        <Typography variant="body2" color="text.secondary">
          Planned next slice: {nextStep}
        </Typography>
      </Stack>
    </Paper>
  );
}
