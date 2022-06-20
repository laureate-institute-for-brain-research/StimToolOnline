#!/usr/bin/env Rscript
# Generate Interactive HTML Code of Dotprobe Plot

# Initial 

#print(getwd())

args <- commandArgs(TRUE)
subject <- as.character(args[1])

if(!require(ggplot2)){
  install.packages('ggplo2')
  library(ggplot2)
}
if(!require(plotly)){
  install.packages('plotly')
  library(plotly)
}


#session1Data <- read_csv("~/Google_Drive/LIBR_Personal/Projects-gdrive/MKTurk4/task/data/DP-JT2-T1-2018_2_4_1615.csv", skip = 1)
#session2Data <- read_csv("~/Google_Drive/LIBR_Personal/Projects-gdrive/MKTurk4/task/data/DP-JT2-T1-2018_2_4_1615.csv", skip = 1)


#data <- read.csv("~/Google_Drive/LIBR_Personal/Projects-gdrive/MKTurk4/stats/JT1table.csv", header = TRUE)

# For Testing
#subject = 'JT1'

pathToTable = paste(subject,'DPTable.csv',sep = '')

data <- read.csv(pathToTable, header = TRUE)

# making the plot
g <- ggplot(data = na.omit(data), aes(x = trial_number, y = rt, group = group, color = group)) + 
    geom_point() + 
    geom_line() +
    facet_wrap(~ session, ncol = 1, scales = 'free_y') + 
    scale_colour_discrete("") +
    #scale_y_continuous(limits = c(0,5)) + 
    #scale_x_continuous(breaks = seq(1,10,1)) + 
    labs(title="", x = "Trial Number", y = "Reaction Time (sec)") + 
    theme(#panel.background = element_rect(fill = 'grey'),
          axis.line = element_line(color = 'black', size = 0.1),
          axis.text = element_text(size = 10),
          axis.title = element_text(size = 10),
          legend.position = 'top') +
    theme_dark()


p <- ggplotly(g, dynamicTicks = TRUE) %>%
  layout(legend = list(orientation = 'h',
                       x=0.35,y=1.10),
         margin = list(l=75, b= 75),
         dragmode = "zoom")
#rangeslider(p)
# outputPlot
#pathTosave <- paste('../public/stats/',subject,'DP.html',sep = '')
#pathTosave <- file.path("..", "public", "stats", paste(subject,"DP.html",sep = ''))
#setwd("../public/stats")
setwd("../")
setwd("public")
setwd("stats")
filename <- paste(subject,'DP.html',sep = '')
htmlwidgets::saveWidget(p, filename, selfcontained = FALSE)

