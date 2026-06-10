const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/app/(main)/layout.tsx',
    search: 'const config = JSON.parse(JSON.stringify());',
    replace: 'const config = JSON.parse(JSON.stringify(await Config.findOne({ key: "mainConfig" }).lean()));'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const movies = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify()) || []));',
    replace: 'const movies = JSON.parse(JSON.stringify(await Movie.find().limit(24).lean())) || [];'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const series = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify()) || []));',
    replace: 'const series = JSON.parse(JSON.stringify(await Series.find().limit(24).lean())) || [];'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const profile = JSON.parse(JSON.stringify());',
    replace: 'const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const allMovies = JSON.parse(JSON.stringify());',
    replace: 'const allMovies = JSON.parse(JSON.stringify(await Movie.find({ id: { $in: movieIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const allEpisodes = JSON.parse(JSON.stringify());',
    replace: 'const allEpisodes = JSON.parse(JSON.stringify(await Episode.find({ id: { $in: episodeIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const allSeries = JSON.parse(JSON.stringify());',
    replace: 'const allSeries = JSON.parse(JSON.stringify(await Series.find({ id: { $in: cSeriesIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/page.tsx',
    search: 'const seriesEpisodes = JSON.parse(JSON.stringify());',
    replace: 'const seriesEpisodes = JSON.parse(JSON.stringify(await Episode.find({ seriesId: { $in: topSeriesIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/catch-up/page.tsx',
    search: 'const profile = JSON.parse(JSON.stringify());',
    replace: 'const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));'
  },
  {
    file: 'src/app/(main)/catch-up/page.tsx',
    search: 'const movies = JSON.parse(JSON.stringify());',
    replace: 'const movies = JSON.parse(JSON.stringify(await Movie.find({ id: { $in: movieIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/catch-up/page.tsx',
    search: 'const episodes = JSON.parse(JSON.stringify());',
    replace: 'const episodes = JSON.parse(JSON.stringify(await Episode.find({ id: { $in: episodeIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/catch-up/page.tsx',
    search: 'const series = JSON.parse(JSON.stringify());',
    replace: 'const series = JSON.parse(JSON.stringify(await Series.find({ id: { $in: seriesIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/favorites/page.tsx',
    search: 'const profile = JSON.parse(JSON.stringify());',
    replace: 'const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));'
  },
  {
    file: 'src/app/(main)/favorites/page.tsx',
    search: 'const favoriteMovies = JSON.parse(JSON.stringify());',
    replace: 'const favoriteMovies = JSON.parse(JSON.stringify(await Movie.find({ id: { $in: favoriteMovieIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/favorites/page.tsx',
    search: 'const favoriteSeries = JSON.parse(JSON.stringify());',
    replace: 'const favoriteSeries = JSON.parse(JSON.stringify(await Series.find({ id: { $in: favoriteSeriesIds } }).lean()));'
  },
  {
    file: 'src/app/(main)/movies/page.tsx',
    search: 'const moviesList = JSON.parse(JSON.stringify()) || [];',
    replace: 'const moviesList = JSON.parse(JSON.stringify(await Movie.find().lean())) || [];'
  },
  {
    file: 'src/app/(main)/series/page.tsx',
    search: 'let seriesList = JSON.parse(JSON.stringify()) || [];',
    replace: 'let seriesList = JSON.parse(JSON.stringify(await Series.find().lean())) || [];'
  },
  {
    file: 'src/app/(main)/series/[id]/page.tsx',
    search: 'const series = JSON.parse(JSON.stringify());',
    replace: 'const series = JSON.parse(JSON.stringify(await Series.findOne({ id }).lean()));'
  },
  {
    file: 'src/app/(main)/series/[id]/page.tsx',
    search: 'const user = JSON.parse(JSON.stringify());',
    replace: 'const user = JSON.parse(JSON.stringify(await User.findOne({ id: payload.userId }).lean()));'
  },
  {
    file: 'src/app/(main)/series/[id]/page.tsx',
    search: 'const profile = JSON.parse(JSON.stringify());',
    replace: 'const profile = JSON.parse(JSON.stringify(await Profile.findOne({ id: profileId, userId: payload.userId }).lean()));'
  },
  {
    file: 'src/app/(main)/series/[id]/page.tsx',
    search: 'const episodes: any[] = JSON.parse(JSON.stringify()) || [];',
    replace: 'const episodes: any[] = JSON.parse(JSON.stringify(await Episode.find({ seriesId: series.id }).lean())) || [];'
  },
  {
    file: 'src/app/(main)/sports/page.tsx',
    search: 'const channels = JSON.parse(JSON.stringify()) || [];',
    replace: 'const channels = JSON.parse(JSON.stringify(await SportsChannel.find().lean())) || [];'
  },
  {
    file: 'src/app/(main)/sports/[id]/page.tsx',
    search: 'const channel = JSON.parse(JSON.stringify());',
    replace: 'const channel = JSON.parse(JSON.stringify(await SportsChannel.findOne({ id }).lean()));'
  }
];

for (const fix of fixes) {
  const fp = path.resolve(fix.file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    if (content.includes(fix.search)) {
      content = content.replace(fix.search, fix.replace);
      fs.writeFileSync(fp, content, 'utf8');
      console.log('Fixed ' + fix.file);
    } else {
      console.log('Search string not found in ' + fix.file);
    }
  } else {
    console.log('File not found: ' + fix.file);
  }
}
